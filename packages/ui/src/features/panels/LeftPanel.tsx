/**
 * LeftPanel Component
 *
 * Left side panel (320px) with slide-in animation.
 * Contains: Workspace switcher, Codebases list, Import button, Collaboration.
 */

import { useUIStore } from '../../shared/stores/uiStore';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';
import { CodebaseList } from '../workspace/CodebaseList';
import { ImportCodebaseButton } from '../workspace/ImportCodebaseButton';
import SessionControl from '../collaboration/SessionControl';

interface LeftPanelProps {
  workspaceId: string;
  selectedCodebaseId?: string;
  onCodebaseSelected: (codebaseId: string) => void;
  refreshTrigger: number;
  onImportSuccess: () => void;
  onImportComplete: (repositoryId: string) => void;
}

export function LeftPanel({
  workspaceId,
  selectedCodebaseId,
  onCodebaseSelected,
  refreshTrigger,
  onImportSuccess,
  onImportComplete,
}: LeftPanelProps) {
  const isOpen = useUIStore((state) => state.isLeftPanelOpen);
  const closePanel = useUIStore((state) => state.closeLeftPanel);

  return (
    <aside
      className={`absolute top-0 left-0 h-full w-80 bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-30 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      data-testid="left-panel"
      aria-label="Navigation menu"
      aria-hidden={!isOpen}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Menu</h2>
          <button
            onClick={closePanel}
            className="p-2 hover:bg-gray-700 rounded text-gray-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Workspace Switcher */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Workspace
            </h3>
            <WorkspaceSwitcher />
          </div>

          {/* Codebases List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Codebases
            </h3>
            <CodebaseList
              workspaceId={workspaceId}
              selectedId={selectedCodebaseId}
              onCodebaseSelected={onCodebaseSelected}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* Import Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Actions
            </h3>
            <ImportCodebaseButton
              workspaceId={workspaceId}
              onImportSuccess={onImportSuccess}
              onImportComplete={onImportComplete}
            />
          </div>

          {/* Collaboration */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Collaboration
            </h3>
            <SessionControl />
          </div>
        </div>
      </div>
    </aside>
  );
}
