// import React from "react";
// //import { Link } from "react-router";
// import { Link, Outlet, useNavigate } from "react-router-dom";
// import { Box, AppBar, Toolbar, Typography, Button } from "@mui/material";
// //import { Home } from "@mui/icons-material";
// import {
//   Home,
//   Logout,
//   Login as LoginIcon,
//   PersonAdd,
// } from "@mui/icons-material";

// const useAuth = () => {
//   // Replace this with real authentication logic (e.g., checking token in localStorage, or a state variable)
//   const isAuthenticated = localStorage.getItem("authToken") ? true : false;
//   const navigate = useNavigate();

//   const logout = () => {
//     localStorage.removeItem("authToken"); // Clear the token
//     navigate("/login"); // Redirect to login page
//   };

//   return { isAuthenticated, logout };
// };

// const Layout: React.FC = () => {
//   const { isAuthenticated, logout } = useAuth();

//   // Note: The Layout component is only rendered for authenticated routes
//   // in your App.tsx, so the user is expected to be authenticated here.
//   // We still include the check for flexibility and best practice.

//   return (
//     <Box sx={{ flexGrow: 1 }}>
//       <AppBar position="static" color="default" elevation={1}>
//         <Toolbar>
//           {/* Logo/App Title with Link to Home (Projects List) */}
//           <Typography
//             variant="h6"
//             component="div"
//             sx={{ flexGrow: 1, fontWeight: "bold" }}
//           >
//             <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
//               Aegis Project Management
//             </Link>
//           </Typography>

//           {/* ------------------ Navigation Links ------------------ */}
//           <Button
//             component={Link}
//             to="/"
//             startIcon={<Home />}
//             color="inherit"
//             sx={{ display: isAuthenticated ? "flex" : "none" }} // Only show if logged in
//           >
//             Projects
//           </Button>

//           {/* ------------------ Auth Buttons ------------------ */}
//           {isAuthenticated ? (
//             // Button to log out
//             <Button onClick={logout} startIcon={<Logout />} color="inherit">
//               Logout
//             </Button>
//           ) : (
//             // Buttons for Login and Signup
//             <>
//               <Button
//                 component={Link}
//                 to="/login"
//                 startIcon={<LoginIcon />}
//                 color="inherit"
//               >
//                 Login
//               </Button>
//               <Button
//                 component={Link}
//                 to="/signup"
//                 startIcon={<PersonAdd />}
//                 color="primary"
//                 variant="contained"
//                 sx={{ ml: 2 }}
//               >
//                 Sign Up
//               </Button>
//             </>
//           )}
//         </Toolbar>
//       </AppBar>

//       <main>
//         <Outlet />
//         {/*  USE Outlet HERE to render the nested route content */}
//       </main>
//     </Box>
//   );
// };

// export default Layout;

import React, { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider, // Added Divider import
} from "@mui/material";
import {
  Home,
  Logout,
  Login as LoginIcon,
  PersonAdd,
} from "@mui/icons-material";
import { useUserStore } from "../stores/userStore"; // Corrected import path assuming Layout is in components/ and stores is in src/stores/

const Layout: React.FC = () => {
  const navigate = useNavigate();
  // Get current user and authentication state from the global store
  const { currentUser, isAuthenticated, logout } = useUserStore();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    // Redirect to login after global state logout
    navigate("/login");
  };

  // Use a sensible default avatar if none is available
  const userAvatar =
    currentUser?.avatar ||
    "https://placehold.co/32x32/1976D2/FFFFFF?text=" +
      (currentUser?.name?.charAt(0) || "?");
  const userNameInitial = currentUser?.name?.charAt(0) || "";

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          {/* Logo/App Title with Link to Home (Projects List) */}
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
              Aegis Project Management
            </Link>
          </Typography>

          {/* ------------------ Navigation Links ------------------ */}
          {isAuthenticated && (
            <Button
              component={Link}
              to="/"
              startIcon={<Home />}
              color="inherit"
              sx={{ mr: 2 }}
            >
              Projects
            </Button>
          )}

          {/* ------------------ Auth Buttons / User Avatar ------------------ */}
          {isAuthenticated && currentUser ? (
            <>
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{ ml: 2 }}
                title={currentUser.name}
              >
                <Avatar
                  src={userAvatar}
                  sx={{ width: 32, height: 32 }}
                  alt={currentUser.name}
                >
                  {userNameInitial}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: "visible",
                    filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                    mt: 1.5,
                    "& .MuiAvatar-root": {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    // CSS triangle for dropdown menu pointer
                    "&::before": {
                      content: '""',
                      display: "block",
                      position: "absolute",
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: "background.paper",
                      transform: "translateY(-50%) rotate(45deg)",
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem sx={{ p: 1, pointerEvents: "none" }}>
                  {" "}
                  {/* Non-clickable profile header */}
                  <Avatar src={userAvatar} alt={currentUser.name} />
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {currentUser.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {currentUser.email}
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </>
          ) : (
            // Buttons for Login and Signup
            <>
              <Button
                component={Link}
                to="/login"
                startIcon={<LoginIcon />}
                color="inherit"
              >
                Login
              </Button>
              <Button
                component={Link}
                to="/signup"
                startIcon={<PersonAdd />}
                color="primary"
                variant="contained"
                sx={{ ml: 2 }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <main>
        <Outlet />
      </main>
    </Box>
  );
};

export default Layout;
