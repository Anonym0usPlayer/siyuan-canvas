<template>
  <div
    class="canvas-shell inspector"
    style="height: 100%; min-height: 0; display: flex; flex-direction: column; overflow: hidden;"
    @pointerdown.capture.stop
    @click="sortDropdownOpen = false; closeContextMenu()"
  >
    <div class="inspector__content" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
      <!-- 头部页签导航 -->
      <div class="inspector__header" style="flex-shrink: 0;">
        <nav
          class="inspector__tabs"
          role="tablist"
          data-testid="inspector-tabs"
        >
          <button
            class="inspector__tab"
            :class="{ 'inspector__tab--active': activeTab === 'documents' }"
            role="tab"
            :aria-selected="activeTab === 'documents'"
            type="button"
            @click="activeTab = 'documents'"
          >
            {{ t("inspectorTabDocuments") }}
          </button>
          <button
            class="inspector__tab"
            :class="{
              'inspector__tab--active': activeTab === 'selection',
              'inspector__tab--disabled': !hasActiveEditor
            }"
            role="tab"
            :aria-selected="activeTab === 'selection'"
            :disabled="!hasActiveEditor"
            type="button"
            @click="activeTab = 'selection'"
          >
            {{ t("inspectorTabSelection") }}
          </button>
        </nav>
      </div>

      <!-- 内容展示区 -->
      <div class="inspector__tabs-content" style="flex: 1; overflow-y: auto; min-height: 0; padding: 8px;">
        <!-- 1. Canvas 目录树 Tab -->
        <div v-show="activeTab === 'documents'">
          <div class="inspector__toolbar" style="display: flex; gap: 4px; margin-bottom: 8px; justify-content: flex-end; position: relative;">
            <button
              class="inspector__toolbar-button canvas-icon-button"
              :aria-label="t('inspectorNewCanvas')"
              :data-tooltip="t('inspectorNewCanvas')"
              type="button"
              @click="handleCreateCanvas"
            >
              <CanvasIcon
                name="new-canvas"
                :size="16"
              />
            </button>
            <button
              class="inspector__toolbar-button canvas-icon-button"
              :aria-label="t('inspectorNewFolder')"
              :data-tooltip="t('inspectorNewFolder')"
              type="button"
              @click="handleCreateFolder"
            >
              <CanvasIcon
                name="new-folder"
                :size="16"
              />
            </button>
            <button
              class="inspector__toolbar-button canvas-icon-button"
              :class="{ 'inspector__toolbar-button--active': sortDropdownOpen }"
              :aria-label="t('inspectorSort')"
              :data-tooltip="t('inspectorSort')"
              type="button"
              @click.stop="sortDropdownOpen = !sortDropdownOpen"
            >
              <CanvasIcon
                name="sort"
                :size="16"
              />
            </button>
            <button
              class="inspector__toolbar-button canvas-icon-button"
              :aria-label="allFoldersExpanded ? t('inspectorCollapseAll') : t('inspectorExpandAll')"
              :data-tooltip="allFoldersExpanded ? t('inspectorCollapseAll') : t('inspectorExpandAll')"
              type="button"
              @click="handleToggleAllFolders"
            >
              <CanvasIcon
                name="expand-all"
                :size="16"
              />
            </button>

            <!-- 排序下拉菜单 -->
            <div
              v-if="sortDropdownOpen"
              class="inspector__sort-dropdown"
              role="menu"
              style="position: absolute; right: 0; top: 100%; z-index: 100;"
              @click.stop
            >
              <div class="inspector__sort-dropdown-group">
                <button
                  :class="['inspector__sort-dropdown-item', { 'inspector__sort-dropdown-item--active': workspaceSortField === 'name' }]"
                  type="button"
                  @click="handleSetWorkspaceSortField('name')"
                >{{ t('inspectorSortByName') }}</button>
                <button
                  :class="['inspector__sort-dropdown-item', { 'inspector__sort-dropdown-item--active': workspaceSortField === 'updated' }]"
                  type="button"
                  @click="handleSetWorkspaceSortField('updated')"
                >{{ t('inspectorSortByUpdated') }}</button>
                <button
                  :class="['inspector__sort-dropdown-item', { 'inspector__sort-dropdown-item--active': workspaceSortField === 'created' }]"
                  type="button"
                  @click="handleSetWorkspaceSortField('created')"
                >{{ t('inspectorSortByCreated') }}</button>
              </div>
              <div class="inspector__sort-dropdown-divider" />
              <div class="inspector__sort-dropdown-group">
                <button
                  :class="['inspector__sort-dropdown-item', { 'inspector__sort-dropdown-item--active': workspaceSortDirection === 'asc' }]"
                  type="button"
                  @click="handleSetWorkspaceSortDirection('asc')"
                >{{ t('inspectorSortAsc') }}</button>
                  <button
                  :class="['inspector__sort-dropdown-item', { 'inspector__sort-dropdown-item--active': workspaceSortDirection === 'desc' }]"
                  type="button"
                  @click="handleSetWorkspaceSortDirection('desc')"
                >{{ t('inspectorSortDesc') }}</button>
              </div>
            </div>
          </div>

          <!-- 大纲文件树部分 -->
          <section class="inspector__section">
            <button
              class="inspector__section-toggle"
              type="button"
              @click="toggleInspectorSection('document')"
            >
              <h2>{{ t("inspectorDocument") }}</h2>
              <CanvasIcon
                name="chevron-right"
                class="inspector__section-chevron"
                :class="{'inspector__section-chevron--expanded': inspectorSectionState.document}"
              />
            </button>
            <div
              v-show="inspectorSectionState.document"
              data-testid="inspector-section-document-body"
            >
              <CanvasWorkspaceTree
                v-if="workspaceDocuments.length"
                :workspace-documents="workspaceDocuments"
                :expanded-folders="workspaceExpandedFolders"
                :current-file-path="activeEditorFilePath"
                :drag-over-folder-path="dragOverFolderPath"
                :delete-title="t('selectionToolbarDelete')"
                @toggle-folder="handleToggleFolder"
                @open-file="handleOpenFile"
                @delete-document="handleDeleteDocument"
                @context-menu="onContextMenu"
                @root-drop="onRootDrop"
                @folder-drag-over="onFolderDragOver"
                @folder-drag-enter="onFolderDragEnter"
                @folder-drag-leave="onFolderDragLeave"
                @folder-drop="onFolderDrop"
                @file-drag-start="onFileDragStart"
                @drag-end="onDragEnd"
              />
              <p v-else class="workspace-tree__empty" style="text-align: center; color: var(--b3-theme-label); padding: 16px;">
                {{ t("inspectorNoWorkspaceCanvasFiles") }}<br>
                <code>{{ defaultCanvasDirectory }}/</code>
              </p>
            </div>
          </section>

          <!-- 最近文档历史模块 -->
          <section class="inspector__section">
            <button
              class="inspector__section-toggle"
              type="button"
              @click="toggleInspectorSection('recent')"
            >
              <h2>{{ t("inspectorRecent") }}</h2>
              <CanvasIcon
                name="chevron-right"
                class="inspector__section-chevron"
                :class="{'inspector__section-chevron--expanded': inspectorSectionState.recent}"
              />
            </button>
            <div v-show="inspectorSectionState.recent">
              <div
                v-if="recentFiles.length"
                class="recent-list"
              >
                <div
                  v-for="recent in recentFiles"
                  :key="recent.path"
                  class="recent-list__item"
                  :title="recent.path"
                >
                  <button
                    class="recent-list__item-open"
                    type="button"
                    @click="handleOpenRecentFile(recent)"
                  >
                    <CanvasIcon
                      class="recent-list__item-icon"
                      name="canvas-file"
                      :size="14"
                    />
                    <span class="workspace-tree__name">{{ recent.title }}</span>
                  </button>
                  <button
                    class="recent-list__item-delete canvas-icon-button"
                    :aria-label="t('selectionToolbarDelete')"
                    :data-tooltip="t('selectionToolbarDelete')"
                    type="button"
                    @click.stop="handleRemoveRecentFileRecord(recent.path)"
                  >
                    <CanvasIcon name="close" :size="12" />
                  </button>
                </div>
              </div>
              <p v-else class="workspace-tree__empty" style="text-align: center; color: var(--b3-theme-label); padding: 16px;">
                {{ t("inspectorNoRecentWorkspaceFiles") }}
              </p>
            </div>
          </section>
        </div>

        <!-- 2. 元素属性 Tab -->
        <div v-show="activeTab === 'selection'">
          <CanvasInspector
            v-if="hasActiveEditor"
            :editor="(activeEditor as Record<string, unknown>)"
            :get-side-label="getSideLabel"
            :t="t"
          />
          <div v-else class="dock-empty-tip" style="text-align: center; color: var(--b3-theme-label); padding: 32px 16px;">
            {{ t("dockEmptySelectionTip") }}
          </div>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div
        v-if="contextMenuVisible"
        class="workspace-context-menu"
        role="menu"
        :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px', zIndex: 99999 }"
        @click.stop
      >
        <button
          class="workspace-context-menu__item"
          role="menuitem"
          type="button"
          @click="contextMenuRename"
        >
          <CanvasIcon class="workspace-context-menu__icon" name="edit" :size="14" />
          {{ t('contextMenuRename') }}
        </button>
        <button
          class="workspace-context-menu__item"
          role="menuitem"
          type="button"
          @click="contextMenuOpenInExplorer"
        >
          <CanvasIcon class="workspace-context-menu__icon" name="folder-open" :size="14" />
          {{ t('contextMenuOpenInExplorer') }}
        </button>
        <button
          v-if="contextMenuType === 'file'"
          class="workspace-context-menu__item"
          role="menuitem"
          type="button"
          @click="contextMenuCopy"
        >
          <CanvasIcon class="workspace-context-menu__icon" name="copy" :size="14" />
          {{ t('contextMenuCopy') }}
        </button>
        <button
          v-if="contextMenuType === 'file'"
          class="workspace-context-menu__item"
          role="menuitem"
          type="button"
          @click="contextMenuCopyPath"
        >
          <CanvasIcon class="workspace-context-menu__icon" name="copy-path" :size="14" />
          {{ t('contextMenuCopyPath') }}
        </button>
        <template v-if="contextMenuType === 'folder'">
          <button
            class="workspace-context-menu__item"
            role="menuitem"
            type="button"
            @click="contextMenuNewSubfolder"
          >
            <CanvasIcon class="workspace-context-menu__icon" name="new-folder" :size="14" />
            {{ t('contextMenuNewSubfolder') }}
          </button>
          <button
            class="workspace-context-menu__item"
            role="menuitem"
            type="button"
            @click="contextMenuNewDocument"
          >
            <CanvasIcon class="workspace-context-menu__icon" name="new-canvas" :size="14" />
            {{ t('contextMenuNewDocument') }}
          </button>
        </template>
        <div class="workspace-context-menu__divider" />
        <button
          class="workspace-context-menu__item workspace-context-menu__item--danger"
          role="menuitem"
          type="button"
          @click="contextMenuDelete"
        >
          <CanvasIcon class="workspace-context-menu__icon" name="delete" :size="14" />
          {{ t('contextMenuDelete') }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Plugin } from "siyuan"
import { showMessage as siyuanShowMessage } from "siyuan"
import {
  computed,
  ref,
  watch,
} from "vue"
import {
  putFile as siyuanPutFile,
  readDir as siyuanReadDir,
  removeFile as siyuanRemoveFile,
} from "@/api"
import { openConfirmDialog } from "@/canvas/confirm-dialog"
import { openTextInputDialog } from "@/canvas/text-input-dialog"
import { createCanvasEditorWorkspaceTree } from "@/canvas/use-canvas-editor-workspace-tree"
import { useCanvasWorkspaceContextMenu } from "@/components/canvas/use-canvas-workspace-context-menu"
import { CanvasIcon } from "@/components/canvas/canvas-icon"
import CanvasWorkspaceTree from "@/components/canvas/CanvasWorkspaceTree.vue"
import CanvasInspector from "@/components/canvas/CanvasInspector.vue"
import { createCanvasI18n } from "@/i18n/canvas"

const props = defineProps<{
  plugin: Plugin
}>()

const t = createCanvasI18n((props.plugin as any).i18n)

// 标签页控制
const activeTab = ref<'documents' | 'selection'>('documents')
const sortDropdownOpen = ref(false)

// 活跃画布状态绑定
const activeEditor = computed(() => (props.plugin as any)?.activeEditor?.value ?? null)
const hasActiveEditor = computed(() => !!activeEditor.value)
const activeEditorFilePath = computed(() => activeEditor.value?.state?.filePath ?? "")

// 最近文档响应式触发与本地备份数据
const localRecentFiles = ref<any[]>([])

const refreshLocalRecentFiles = () => {
  localRecentFiles.value = (props.plugin as any).getRecentCanvasFiles()
}

// 展开折叠状态同步
const localInspectorSectionState = ref({
  document: true,
  recent: true,
})

const inspectorSectionState = computed(() => {
  if (hasActiveEditor.value && activeEditor.value) {
    return activeEditor.value.inspectorSectionState
  }
  return localInspectorSectionState.value
})

const toggleInspectorSection = (section: 'document' | 'recent') => {
  if (hasActiveEditor.value) {
    activeEditor.value.toggleInspectorSection(section)
  } else {
    localInspectorSectionState.value[section] = !localInspectorSectionState.value[section]
  }
}

// 监听活跃编辑器状态，当画布关闭时如果当前在属性页则强制切回文件树 Tab
watch(hasActiveEditor, (newVal) => {
  if (!newVal && activeTab.value === 'selection') {
    activeTab.value = 'documents'
  }
})

// === 1. Standalone Workspace Tree 实例化 ===
const refreshRecentFiles = () => {
  refreshLocalRecentFiles()
}

const standaloneWorkspaceTree = createCanvasEditorWorkspaceTree({
  readDir: siyuanReadDir,
  putFile: siyuanPutFile,
  removeFile: siyuanRemoveFile,
  showMessage: siyuanShowMessage,
  getSettings: () => (props.plugin as any)?.getCanvasSettings?.() ?? {},
  plugin: props.plugin as any,
  onFilePathUpdate: (path: string) => {
    props.plugin?.openCanvasTab?.({ path })
  },
  refreshRecentFiles,
  promptText: openTextInputDialog,
  confirm: openConfirmDialog,
  labels: {
    copyTitle: t("selectionToolbarCopy") || "复制",
    deleteCanvasTitle: t("selectionToolbarDelete") || "删除画布",
    deleteFolderTitle: t("contextMenuDelete") || "删除文件夹",
    dialogCancel: t("dialogCancel") || "取消",
    dialogConfirm: t("dialogConfirm") || "确认",
    folderNameTitle: t("inspectorNewFolder") || "新建文件夹",
    renameFolderTitle: t("contextMenuRename") || "重命名文件夹",
    renameTitle: t("contextMenuRename") || "重命名",
    unableToSaveMessage: t("unableToSave") || "无法保存",
  }
})

// 当没有活跃画布时，自动刷新 standalone 文件树和最近文件数据
watch(hasActiveEditor, (newVal) => {
  if (!newVal) {
    standaloneWorkspaceTree.refreshWorkspaceDocuments()
    refreshLocalRecentFiles()
  }
}, { immediate: true })

// === 2. 状态映射与统一计算 ===
const workspaceDocuments = computed(() => {
  if (hasActiveEditor.value && activeEditor.value) {
    return activeEditor.value.workspaceDocuments
  }
  return standaloneWorkspaceTree.workspaceDocuments.value
})

const workspaceExpandedFolders = computed(() => {
  if (hasActiveEditor.value && activeEditor.value) {
    return activeEditor.value.expandedFolders ?? new Set<string>()
  }
  return standaloneWorkspaceTree.expandedFolders.value ?? new Set<string>()
})

const workspaceSortField = computed(() => {
  if (hasActiveEditor.value && activeEditor.value) {
    return activeEditor.value.workspaceSortField
  }
  return standaloneWorkspaceTree.workspaceSortField.value
})

const workspaceSortDirection = computed(() => {
  if (hasActiveEditor.value && activeEditor.value) {
    return activeEditor.value.workspaceSortDirection
  }
  return standaloneWorkspaceTree.workspaceSortDirection.value
})

const defaultCanvasDirectory = computed(() => {
  return (props.plugin as any)?.getCanvasSettings?.()?.defaultCanvasDirectory ?? ""
})

const allFoldersExpanded = computed(() => {
  if (hasActiveEditor.value && activeEditor.value) {
    return activeEditor.value.allFoldersExpanded
  }
  return standaloneWorkspaceTree.allFoldersExpanded.value
})

const dragOverFolderPath = computed(() => {
  if (hasActiveEditor.value && activeEditor.value) {
    return activeEditor.value.dragOverFolderPath
  }
  return standaloneWorkspaceTree.dragOverFolderPath.value
})

const recentFiles = computed(() => {
  if (hasActiveEditor.value && activeEditor.value) {
    return activeEditor.value.recentFiles
  }
  return localRecentFiles.value
})

// === 3. 操作代理包装 ===
const handleToggleFolder = (path: string) => {
  if (hasActiveEditor.value) {
    activeEditor.value.toggleFolderExpand(path)
  } else {
    standaloneWorkspaceTree.toggleFolderExpand(path)
  }
}

const handleOpenFile = (path: string) => {
  props.plugin.openCanvasTab({ path })
}

const handleDeleteDocument = (path: string) => {
  if (hasActiveEditor.value) {
    activeEditor.value.deleteWorkspaceDocument(path)
  } else {
    standaloneWorkspaceTree.deleteWorkspaceDocument(path)
  }
}

const handleCreateCanvas = async () => {
  if (hasActiveEditor.value && activeEditor.value) {
    await activeEditor.value.newCanvas()
  } else {
    props.plugin.openCanvasTab()
  }
}

const handleCreateFolder = async () => {
  if (hasActiveEditor.value && activeEditor.value) {
    await activeEditor.value.createWorkspaceFolder()
  } else {
    await standaloneWorkspaceTree.createWorkspaceFolder()
  }
}

const handleToggleAllFolders = () => {
  if (hasActiveEditor.value && activeEditor.value) {
    activeEditor.value.expandAllInspectorSections()
  } else {
    if (standaloneWorkspaceTree.allFoldersExpanded.value) {
      standaloneWorkspaceTree.collapseAllFolders()
    } else {
      standaloneWorkspaceTree.expandAllFolders()
    }
  }
}

const handleSetWorkspaceSortField = (field: 'name' | 'updated' | 'created') => {
  if (hasActiveEditor.value) {
    activeEditor.value.setWorkspaceSortField(field)
  } else {
    standaloneWorkspaceTree.setWorkspaceSortField(field)
  }
  sortDropdownOpen.value = false
}

const handleSetWorkspaceSortDirection = (direction: 'asc' | 'desc') => {
  if (hasActiveEditor.value) {
    activeEditor.value.setWorkspaceSortDirection(direction)
  } else {
    standaloneWorkspaceTree.setWorkspaceSortDirection(direction)
  }
  sortDropdownOpen.value = false
}

const handleOpenRecentFile = (recent: any) => {
  props.plugin.openCanvasTab({ path: recent.path })
}

const handleRemoveRecentFileRecord = async (path: string) => {
  if (hasActiveEditor.value) {
    await activeEditor.value.removeRecentFileRecord(path)
  } else {
    await (props.plugin as any).removeRecentCanvasFile(path)
    refreshLocalRecentFiles()
  }
}

// === 4. 右键菜单与代理 ===
const currentTreeProvider = computed(() => {
  if (hasActiveEditor.value && activeEditor.value) {
    return {
      ...activeEditor.value,
      newCanvas: () => activeEditor.value.newCanvas()
    }
  }
  return {
    ...standaloneWorkspaceTree,
    newCanvas: () => props.plugin.openCanvasTab()
  }
})

const contextMenuEditorProxy = {
  copyWorkspaceDocument: (path: string) => currentTreeProvider.value.copyWorkspaceDocument(path),
  createWorkspaceFolder: (path?: string) => currentTreeProvider.value.createWorkspaceFolder(path),
  deleteWorkspaceDocument: (path: string) => currentTreeProvider.value.deleteWorkspaceDocument(path),
  deleteWorkspaceFolder: (path: string) => currentTreeProvider.value.deleteWorkspaceFolder(path),
  openInExplorer: (path: string) => currentTreeProvider.value.openInExplorer(path),
  renameWorkspaceDocument: (path: string) => currentTreeProvider.value.renameWorkspaceDocument(path),
  renameWorkspaceFolder: (path: string) => currentTreeProvider.value.renameWorkspaceFolder(path),
  newCanvas: () => currentTreeProvider.value.newCanvas(),
}

const {
  closeContextMenu,
  contextMenuCopy,
  contextMenuCopyPath,
  contextMenuDelete,
  contextMenuNewDocument,
  contextMenuNewSubfolder,
  contextMenuOpenInExplorer,
  contextMenuRename,
  contextMenuType,
  contextMenuVisible,
  contextMenuX,
  contextMenuY,
  onContextMenu,
} = useCanvasWorkspaceContextMenu({
  copyPath: async (filePath) => {
    try {
      await navigator.clipboard.writeText(filePath)
    } catch (e) {
      console.error("Failed to copy path", e)
    }
  },
  editor: contextMenuEditorProxy,
  showCopyPathSuccess: () => {
    siyuanShowMessage(t("selectionToolbarCopySuccess") || "已复制到剪贴板")
  }
})

// === 5. 拖拽与放置代理事件 ===
const onRootDrop = (event: DragEvent) => {
  if (hasActiveEditor.value) activeEditor.value.handleRootDrop(event)
  else standaloneWorkspaceTree.handleRootDrop(event)
}

const onFolderDragOver = (event: DragEvent, path: string) => {
  if (hasActiveEditor.value) activeEditor.value.handleFolderDragOver(event, path)
  else standaloneWorkspaceTree.handleFolderDragOver(event, path)
}

const onFolderDragEnter = (event: DragEvent, path: string) => {
  if (hasActiveEditor.value) activeEditor.value.handleFolderDragEnter(event, path)
  else standaloneWorkspaceTree.handleFolderDragEnter(event, path)
}

const onFolderDragLeave = (event: DragEvent, path: string) => {
  if (hasActiveEditor.value) activeEditor.value.handleFolderDragLeave(event, path)
  else standaloneWorkspaceTree.handleFolderDragLeave(event, path)
}

const onFolderDrop = (event: DragEvent, path: string) => {
  if (hasActiveEditor.value) activeEditor.value.handleFolderDrop(event, path)
  else standaloneWorkspaceTree.handleFolderDrop(event, path)
}

const onFileDragStart = (event: DragEvent, path: string) => {
  if (hasActiveEditor.value) activeEditor.value.handleFileDragStart(event, path)
  else standaloneWorkspaceTree.handleFileDragStart(event, path)
}

const onDragEnd = (event: DragEvent) => {
  if (hasActiveEditor.value) activeEditor.value.handleDragEnd(event)
  else standaloneWorkspaceTree.handleDragEnd(event)
}

// 标签页辅助方法
const getSideLabel = (side: any) => {
  switch (side) {
    case "top": return t("edgeDirectionTop") || "上"
    case "bottom": return t("edgeDirectionBottom") || "下"
    case "left": return t("edgeDirectionLeft") || "左"
    case "right": return t("edgeDirectionRight") || "右"
    default: return ""
  }
}
</script>

<style scoped lang="scss" src="./canvas-workspace.scss"></style>
