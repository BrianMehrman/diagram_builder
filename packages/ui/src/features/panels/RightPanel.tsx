/**
 * RightPanel Component
 *
 * Right side panel (320px) with slide-in animation.
 * Contains: Export button, Viewpoints, User Presence.
 */

import { useUIStore } from '../../shared/stores/uiStore';
import { ExportButton } from '../export/ExportButton';
import { ViewpointPanel } from '../viewpoints/ViewpointPanel';
import UserPresence from '../collaboration/UserPresence';
import { DensitySlider } from '../canvas/components/DensitySlider';
import { LayerToggle } from '../canvas/components/LayerToggle';
import { HeightEncodingSelector } from '../canvas/components/HeightEncodingSelector';
import { AtmosphereTogglePanel } from '../canvas/components/AtmosphereTogglePanel';
import { EdgeTierControls } from '../canvas/components/EdgeTierControls';

export function RightPanel() {
  const isOpen = useUIStore((state) => state.isRightPanelOpen);
  const closePanel = useUIStore((state) => state.closeRightPanel);

  return (
    <aside
      className={`absolute top-0 right-0 h-full w-80 bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-30 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      data-testid="right-panel"
      aria-label="Tools panel"
      aria-hidden={!isOpen}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Tools</h2>
          <button
            onClick={closePanel}
            className="p-2 hover:bg-gray-700 rounded text-gray-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close tools panel"
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
          {/* Layout Controls */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Layout
            </h3>
            <DensitySlider />
            <HeightEncodingSelector />
            <LayerToggle />
          </div>

          {/* Atmosphere */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Atmosphere
            </h3>
            <AtmosphereTogglePanel />
          </div>

          {/* Edges */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Edges
            </h3>
            <EdgeTierControls />
          </div>

          {/* Export */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Export
            </h3>
            <ExportButton />
          </div>

          {/* Viewpoints */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Viewpoints
            </h3>
            <ViewpointPanel />
          </div>

          {/* User Presence */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Users
            </h3>
            <UserPresence />
          </div>
        </div>
      </div>
    </aside>
  );
}
