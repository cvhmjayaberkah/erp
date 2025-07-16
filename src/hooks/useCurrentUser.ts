
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  children: MenuItem[];
  roles?: string[];
}

export function useCurrentUser() {
  const { userEmail, userRole } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!userEmail) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/details", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: userEmail }),
        });

        if (response.ok) {
          const userData = await response.json();
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
          });
        } else if (response.status === 404) {
          // User not found in database, create a fallback user
          console.warn("User not found in database, using fallback");
          setUser({
            id: `user_${Date.now()}`, // Generate a temporary ID
            email: userEmail,
            name: userEmail.split("@")[0],
            role: userRole || "SALES",
          });
        } else {
          // Other error, use fallback
          setUser({
            id: userEmail, // Use email as fallback ID
            email: userEmail,
            name: userEmail.split("@")[0],
            role: userRole || "SALES",
          });
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        // Fallback to basic user data
        setUser({
          id: userEmail, // Use email as fallback ID
          email: userEmail,
          name: userEmail.split("@")[0],
          role: userRole || "SALES",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userEmail, userRole]);

  return { user, loading };
}

// Role-based menu filtering
export function filterMenuByRole(menuItems: MenuItem[], userRole: string): MenuItem[] {
  if (!userRole) return [];

  // Recursive function to filter menu items based on roles
  const filterItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter(item => {
      // If item has no roles specified, it's accessible to everyone
      if (!item.roles || item.roles.length === 0) return true;

      // Check if user's role is in the item's allowed roles
      const isRoleAllowed = item.roles.includes(userRole);

      // If item has children, recursively filter children
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterItems(item.children);
        
        // If item itself is not allowed but has accessible children, include it
        if (filteredChildren.length > 0) {
          return true;
        }
      }

      return isRoleAllowed;
    }).map(item => {
      // If the item has children, recursively filter them
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: filterItems(item.children)
        };
      }
      return item;
    });
  };

  return filterItems(menuItems);
}
