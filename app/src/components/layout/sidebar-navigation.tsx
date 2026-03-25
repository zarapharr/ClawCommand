import React, { useState } from "react";

/**
 * SidebarNavigation Component
 * Collapsible navigation groups for main app navigation
 */
interface NavItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  badge?: number;
}

interface NavGroup {
  id: string;
  label: string;
  icon?: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

interface SidebarNavigationProps {
  groups: NavGroup[];
  onNavigate?: (itemId: string, href: string) => void;
  activeItem?: string;
  className?: string;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  groups,
  onNavigate,
  activeItem,
  className = "",
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groups.filter((g) => g.defaultOpen).map((g) => g.id))
  );

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <nav className={`flex flex-col gap-2 p-4 ${className}`} role="navigation">
      {groups.map((group) => {
        const isExpanded = expandedGroups.has(group.id);

        return (
          <div key={group.id}>
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors group"
              aria-expanded={isExpanded}
            >
              {group.icon && <span className="text-lg">{group.icon}</span>}
              <span className="flex-1 text-left">{group.label}</span>
              <span
                className={`text-neutral-500 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {isExpanded && (
              <div className="mt-1 flex flex-col gap-1 pl-6">
                {group.items.map((item) => (
                  <a
                    key={item.id}
                    href={item.href || "#"}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.href) {
                        onNavigate?.(item.id, item.href);
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      activeItem === item.id
                        ? "bg-primary-600/20 text-primary-300"
                        : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300"
                    }`}
                  >
                    {item.icon && <span className="text-base">{item.icon}</span>}
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-error-500/20 text-error-300 text-xs font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
