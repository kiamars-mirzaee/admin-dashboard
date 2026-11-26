import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStorageTree,
  computeFolderStats,
  computeStorageSummary,
  createFileNode,
  createFolderNode,
  deleteStorageNode,
  getAllFolders,
  getChildrenForFolder,
  getFolderBreadcrumbPath,
  INITIAL_STORAGE_NODES,
  renameStorageNode,
  resolveScopedRootId,
  updateFileContentNode,
  uploadFilesIntoFolder,
} from './fileStorage';

test('computeStorageSummary counts initial folders, files, and total bytes', () => {
  const summary = computeStorageSummary(INITIAL_STORAGE_NODES);
  assert.equal(summary.totalFolders, 5);
  assert.equal(summary.totalFiles, 8);
  assert.equal(summary.totalBytes > 250000, true);
});

test('createFolderNode adds a nested folder and rejects duplicate sibling names', () => {
  const res = createFolderNode(INITIAL_STORAGE_NODES, {
    parentId: 'fld-compliance',
    name: 'Carrier Manifests',
    owner: 'Elena Rostova',
    nowIso: '2026-11-25T10:00:00Z',
  });
  assert.equal(res.ok, true);
  assert.equal(res.createdNodes?.length, 1);
  const createdFolder = res.createdNodes![0];
  assert.equal(createdFolder.kind, 'folder');
  assert.equal(createdFolder.parentId, 'fld-compliance');

  // Case-insensitive sibling duplicate must be rejected
  const dup = createFolderNode(res.nodes, {
    parentId: 'fld-compliance',
    name: 'carrier manifests',
  });
  assert.equal(dup.ok, false);
  assert.ok(dup.error);
});

test('createFileNode infers extension, MIME type, and exact UTF-8 byte count', () => {
  const res = createFileNode(INITIAL_STORAGE_NODES, {
    parentId: null,
    name: 'q4-targets.json',
    content: '{"target":42000}',
    owner: 'Marcus Chen',
  });
  assert.equal(res.ok, true);
  const created = res.createdNodes![0];
  assert.equal(created.extension, 'json');
  assert.equal(created.mimeType, 'application/json');
  assert.equal(created.sizeBytes, 16);
});

test('uploadFilesIntoFolder deduplicates colliding filenames inside the target folder', () => {
  const firstUpload = uploadFilesIntoFolder(INITIAL_STORAGE_NODES, {
    parentId: 'fld-contracts',
    files: [
      {
        name: 'gridline-partner-msa.pdf',
        sizeBytes: 10240,
        mimeType: 'application/pdf',
      },
      {
        name: 'addendum.csv',
        sizeBytes: 512,
        mimeType: 'text/csv',
        content: 'id,rate\n1,0.02',
      },
    ],
  });

  assert.equal(firstUpload.ok, true);
  assert.equal(firstUpload.createdNodes?.length, 2);
  assert.equal(firstUpload.createdNodes![0].name, 'gridline-partner-msa (1).pdf');
  assert.equal(firstUpload.createdNodes![1].name, 'addendum.csv');
});

test('getFolderBreadcrumbPath walks ancestors cleanly up to root', () => {
  const trail = getFolderBreadcrumbPath(
    INITIAL_STORAGE_NODES,
    'fld-audits-q4'
  );
  assert.deepEqual(
    trail.map((f) => f.id),
    ['fld-compliance', 'fld-audits-q4']
  );
  assert.deepEqual(getFolderBreadcrumbPath(INITIAL_STORAGE_NODES, null), []);
});

test('getChildrenForFolder groups folders before files and searches globally when query provided', () => {
  const rootItems = getChildrenForFolder(INITIAL_STORAGE_NODES, null);
  // First 3 should be folders alphabetically: Compliance & SOC2, Invoices & Settlements, Partner Contracts
  assert.deepEqual(
    rootItems.slice(0, 3).map((n) => n.kind),
    ['folder', 'folder', 'folder']
  );
  assert.equal(rootItems[3].kind, 'file');

  const searchHits = getChildrenForFolder(INITIAL_STORAGE_NODES, null, {
    search: 'soc2',
  });
  assert.equal(
    searchHits.some((n) => n.id === 'file-soc2-checklist'),
    true
  );
});

test('buildStorageTree builds nested branches and computes recursive folder totals', () => {
  const tree = buildStorageTree(INITIAL_STORAGE_NODES);
  const complianceBranch = tree.find((b) => b.node.id === 'fld-compliance')!;
  assert.equal(complianceBranch.directChildCount, 2);
  assert.equal(complianceBranch.recursiveFileCount, 3);
  assert.equal(
    complianceBranch.recursiveSizeBytes,
    computeFolderStats(INITIAL_STORAGE_NODES, 'fld-compliance').recursiveSizeBytes
  );
});

test('renameStorageNode, updateFileContentNode, and recursive deleteStorageNode work deterministically', () => {
  const renamed = renameStorageNode(
    INITIAL_STORAGE_NODES,
    'file-ops-runbook',
    'ops-playbook.md'
  );
  assert.equal(renamed.ok, true);
  assert.equal(renamed.updatedNode?.name, 'ops-playbook.md');

  const updated = updateFileContentNode(
    renamed.nodes,
    'file-ops-runbook',
    '# Updated'
  );
  assert.equal(updated.ok, true);
  assert.equal(updated.updatedNode?.sizeBytes, 9);

  // Deleting 'fld-compliance' must remove itself + 'fld-audits-q4' + 3 files = 5 nodes total
  const deleted = deleteStorageNode(updated.nodes, 'fld-compliance');
  assert.equal(deleted.ok, true);
  assert.equal(deleted.removedCount, 5);
  assert.equal(
    deleted.nodes.some((n) => n.id === 'file-soc2-checklist'),
    false
  );
});

test('predefined rootFolderId scopes breadcrumbs, tree, listing, search, summary, and folder choices strictly to subtree', () => {
  const rootId = resolveScopedRootId(INITIAL_STORAGE_NODES, 'fld-compliance');
  assert.equal(rootId, 'fld-compliance');

  // Breadcrumb at predefined root itself is empty, and nested subfolder stops at predefined root
  assert.deepEqual(
    getFolderBreadcrumbPath(INITIAL_STORAGE_NODES, 'fld-compliance', rootId),
    []
  );
  assert.deepEqual(
    getFolderBreadcrumbPath(INITIAL_STORAGE_NODES, 'fld-audits-q4', rootId).map(
      (f) => f.id
    ),
    ['fld-audits-q4']
  );

  // Root-scoped open-folder listing at null returns children of 'fld-compliance' only
  const scopedChildren = getChildrenForFolder(INITIAL_STORAGE_NODES, null, {
    rootFolderId: rootId,
  });
  assert.deepEqual(
    scopedChildren.map((n) => n.id),
    ['fld-audits-q4', 'file-retention-policy']
  );

  // Scoped search does not leak files from outside predefined root (e.g. 'eu-west-nov-settlement.csv')
  const externalSearch = getChildrenForFolder(INITIAL_STORAGE_NODES, null, {
    rootFolderId: rootId,
    search: 'settlement',
  });
  assert.equal(externalSearch.length, 0);

  // Allowed extensions filter keeps folders browsable while filtering non-matching files
  const jsonOnly = getChildrenForFolder(INITIAL_STORAGE_NODES, 'fld-audits-q4', {
    rootFolderId: rootId,
    allowedExtensions: ['.json'],
  });
  assert.deepEqual(
    jsonOnly.map((n) => n.id),
    ['file-access-matrix']
  );

  // Scoped tree starts inside predefined root
  const scopedTree = buildStorageTree(INITIAL_STORAGE_NODES, {
    rootFolderId: rootId,
  });
  assert.deepEqual(
    scopedTree.map((b) => b.node.id),
    ['fld-audits-q4', 'file-retention-policy']
  );

  // Scoped summary counts strictly descendants inside 'fld-compliance' (1 subfolder, 3 files)
  const scopedSummary = computeStorageSummary(INITIAL_STORAGE_NODES, rootId);
  assert.equal(scopedSummary.totalFolders, 1);
  assert.equal(scopedSummary.totalFiles, 3);

  // Scoped folder dropdown excludes folders outside root
  assert.deepEqual(
    getAllFolders(INITIAL_STORAGE_NODES, rootId).map((f) => f.id),
    ['fld-audits-q4']
  );
});
