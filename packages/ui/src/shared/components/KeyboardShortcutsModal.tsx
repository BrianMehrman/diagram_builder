/**
 * KeyboardShortcutsModal Component
 *
 * Help modal displaying all keyboard shortcuts grouped by category.
 * Opens with ? key, closes with ESC or clicking outside.
 */

import * as Dialog from '@radix-ui/react-dialog';
import { useUIStore } from '../stores/uiStore';

/**
 * Shortcut definition
 */
interface Shortcut {
  keys: string[];
  description: string;
}

/**
 * Shortcut category
 */
interface ShortcutCategory {
  name: string;
  shortcuts: Shortcut[];
}

/**
 * All keyboard shortcuts grouped by category
 */
const shortcutCategories: ShortcutCategory[] = [
  {
    name: 'Search',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open search' },
      { keys: ['↑', '↓'], description: 'Navigate results' },
      { keys: ['Enter'], description: 'Select result' },
      { keys: ['Esc'], description: 'Close search' },
    ],
  },
  {
    name: 'Navigation',
    shortcuts: [
      { keys: ['Home'], description: 'Fly to root node' },
      { keys: ['Esc'], description: 'Deselect node' },
      { keys: ['Click'], description: 'Select node' },
      { keys: ['Double-click'], description: 'Fly to node' },
    ],
  },
  {
    name: 'Camera Controls',
    shortcuts: [
      { keys: ['C'], description: 'Toggle Orbit/Fly mode' },
      { keys: ['Drag'], description: 'Rotate camera (Orbit) / Look around (Fly)' },
      { keys: ['Scroll'], description: 'Zoom in/out' },
      { keys: ['Right-drag'], description: 'Pan camera' },
    ],
  },
  {
    name: 'Sharing',
    shortcuts: [
      { keys: ['⌘', '⇧', 'S'], description: 'Copy viewpoint link' },
    ],
  },
  {
    name: 'Help',
    shortcuts: [
      { keys: ['?'], description: 'Open this help modal' },
    ],
  },
];

/**
 * Keyboard key badge component
 */
interface KeyBadgeProps {
  children: React.ReactNode;
}

function KeyBadge({ children }: KeyBadgeProps) {
  return (
    <kbd
      className="
        inline-flex items-center justify-center
        min-w-[24px] h-6 px-1.5
        bg-gray-100 border border-gray-300
        rounded text-xs font-mono font-medium
        text-gray-700 shadow-sm
      "
    >
      {children}
    </kbd>
  );
}

/**
 * Shortcut row component
 */
interface ShortcutRowProps {
  shortcut: Shortcut;
}

function ShortcutRow({ shortcut }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600">{shortcut.description}</span>
      <div className="flex items-center gap-1">
        {shortcut.keys.map((key, index) => (
          <KeyBadge key={index}>{key}</KeyBadge>
        ))}
      </div>
    </div>
  );
}

/**
 * Shortcut category component
 */
interface ShortcutCategoryProps {
  category: ShortcutCategory;
}

function ShortcutCategorySection({ category }: ShortcutCategoryProps) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
        {category.name}
      </h3>
      <div className="divide-y divide-gray-100">
        {category.shortcuts.map((shortcut, index) => (
          <ShortcutRow key={index} shortcut={shortcut} />
        ))}
      </div>
    </div>
  );
}

/**
 * Keyboard Shortcuts Modal
 */
export function KeyboardShortcutsModal() {
  const isOpen = useUIStore((state) => state.isHelpModalOpen);
  const closeModal = useUIStore((state) => state.closeHelpModal);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay
          className="
            fixed inset-0 bg-black/50
            data-[state=open]:animate-fadeIn
            data-[state=closed]:animate-fadeOut
          "
        />

        {/* Content */}
        <Dialog.Content
          className="
            fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
            bg-white rounded-xl shadow-2xl
            w-full max-w-lg max-h-[85vh]
            overflow-hidden
            data-[state=open]:animate-scaleIn
            data-[state=closed]:animate-scaleOut
            focus:outline-none
          "
          aria-describedby="shortcuts-description"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Keyboard Shortcuts
            </Dialog.Title>
            <Dialog.Description id="shortcuts-description" className="text-sm text-gray-500 mt-1">
              Press ? anytime to show this help
            </Dialog.Description>
          </div>

          {/* Body - Scrollable */}
          <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
            {shortcutCategories.map((category) => (
              <ShortcutCategorySection key={category.name} category={category} />
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              On Windows/Linux, use Ctrl instead of ⌘
            </span>
            <Dialog.Close asChild>
              <button
                className="
                  px-4 py-2 text-sm font-medium
                  bg-primary-600 text-white rounded-lg
                  hover:bg-primary-700 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                "
              >
                Got it
              </button>
            </Dialog.Close>
          </div>

          {/* Close button */}
          <Dialog.Close asChild>
            <button
              className="
                absolute top-4 right-4
                p-1 rounded-full
                text-gray-400 hover:text-gray-600
                hover:bg-gray-100 transition-colors
                focus:outline-none focus:ring-2 focus:ring-gray-300
              "
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
