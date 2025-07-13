"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { usePermissions } from "@/hooks/use-permissions";
import { createMenuGenerator } from "@/lib/utils/menu-generator";
import type { MenuItem } from "@/types/permission";

interface SideBarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

interface MenuItemComponentProps {
  item: MenuItem;
  level?: number;
  shouldShowExpanded: boolean;
  isActive: boolean;
  onItemClick: () => void;
}

const MenuItemComponent: React.FC<MenuItemComponentProps> = ({
  item,
  level = 0,
  shouldShowExpanded,
  isActive,
  onItemClick,
}) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const pathname = usePathname(); // Move hook to top level
  const hasChildren = item.children && item.children.length > 0;
  const paddingLeft = level > 0 ? `${8 + level * 16}px` : "12px";

  const toggleSubMenu = () => {
    if (hasChildren) {
      setIsSubMenuOpen(!isSubMenuOpen);
    }
  };

  return (
    <>
      <li>
        {hasChildren ? (
          <button
            onClick={toggleSubMenu}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-colors ${
              isActive
                ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            style={{ paddingLeft }}
          >
            <div className="flex items-center">
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {shouldShowExpanded && (
                <span className="ml-3 font-medium whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
            </div>
            {shouldShowExpanded && hasChildren && (
              <span
                className={`transform transition-transform ${
                  isSubMenuOpen ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
            )}
          </button>
        ) : (
          <Link
            href={item.href}
            className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
              isActive
                ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            title={!shouldShowExpanded ? item.label : undefined}
            onClick={onItemClick}
            style={{ paddingLeft }}
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            {shouldShowExpanded && (
              <span className="ml-3 font-medium whitespace-nowrap overflow-hidden">
                {item.label}
              </span>
            )}
          </Link>
        )}
      </li>

      {/* Render children if expanded */}
      {hasChildren && isSubMenuOpen && shouldShowExpanded && (
        <ul className="space-y-1">
          {item.children?.map(child => (
            <MenuItemComponent
              key={child.id}
              item={child}
              level={level + 1}
              shouldShowExpanded={shouldShowExpanded}
              isActive={child.href === pathname}
              onItemClick={onItemClick}
            />
          ))}
        </ul>
      )}
    </>
  );
};

export default function SideBar({
  isCollapsed,
  onToggle,
  isMobile = false,
}: SideBarProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Get user permissions and generate menu
  const { accessControl, isAuthenticated } = usePermissions();

  const menuItems = useMemo(() => {
    if (!isAuthenticated || !accessControl) return [];
    const menuGenerator = createMenuGenerator(accessControl);
    return menuGenerator.generateSidebar();
  }, [accessControl, isAuthenticated]);

  // Determine if sidebar should show expanded content
  const shouldShowExpanded = isMobile
    ? !isCollapsed
    : !isCollapsed || isHovered;

  const handleMouseEnter = () => {
    if (!isMobile) {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      const timeout = setTimeout(() => {
        setIsHovered(false);
      }, 200);
      setHoverTimeout(timeout);
    }
  };

  const handleItemClick = () => {
    // Close sidebar on mobile after navigation
    if (isMobile) {
      onToggle();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // Don't render sidebar if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className={`
        sidebar-transition bg-white dark:bg-gray-900 shadow-md 
        ${
          isMobile
            ? `mobile-sidebar ${!isCollapsed ? "open" : ""}`
            : `transition-all duration-300 ${
                shouldShowExpanded ? "w-64" : "w-20"
              } h-screen border-r border-gray-200 dark:border-gray-700 relative`
        }
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        // When collapsed and hovered on desktop, make it appear above content
        ...(!isMobile &&
          isCollapsed &&
          isHovered && {
            position: "fixed",
            left: "0",
            top: "0",
            bottom: "0",
            zIndex: 50,
            boxShadow: "4px 0 20px rgba(0, 0, 0, 0.15)",
          }),
      }}
    >
      {/* Navbar Area in Sidebar */}
      <div className="h-18 p-4 border-gray-200 dark:border-gray-700 flex items-center bg-white dark:bg-gray-900">
        {shouldShowExpanded ? (
          <div className="flex items-center">
            <Image
              src="/favicon.ico"
              alt="Indana ERP Logo"
              width={32}
              height={32}
              className="mr-3"
            />
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              Indana ERP
            </h1>
          </div>
        ) : (
          <div className="flex justify-center w-full">
            <Image
              src="/favicon.ico"
              alt="Indana ERP Logo"
              width={30}
              height={30}
            />
          </div>
        )}
      </div>

      {/* Floating Toggle Button - Only on Desktop */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="
          cursor-pointer absolute -right-4 top-9 z-[60] w-9 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
          style={{
            transform: "translateY(-50%)",
          }}
        >
          <span className="text-xs text-gray-600 dark:text-gray-300 font-bold">
            {isCollapsed ? ">|" : "|<"}
          </span>
        </button>
      )}

      {/* Menu Items */}
      <nav className="mt-4 flex-1 overflow-y-auto">
        {menuItems.length > 0 ? (
          <ul className="space-y-2 px-3">
            {menuItems.map(item => {
              const isActive =
                pathname === item.href ||
                (item.children &&
                  item.children.some(child => child.href === pathname)) ||
                false;

              return (
                <MenuItemComponent
                  key={item.id}
                  item={item}
                  shouldShowExpanded={shouldShowExpanded}
                  isActive={isActive}
                  onItemClick={handleItemClick}
                />
              );
            })}
          </ul>
        ) : (
          <div className="px-3 py-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {shouldShowExpanded ? "No accessible modules" : "🚫"}
            </p>
          </div>
        )}
      </nav>

      {/* Footer */}
      {shouldShowExpanded && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              © 2025 Indana ERP
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
