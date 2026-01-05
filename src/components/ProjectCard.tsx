import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  AvatarGroup,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { People, MoreVert, Delete, OpenInNew } from "@mui/icons-material";
import { useUserStore } from "../stores/userStore";
import type { Project } from "../types";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onClick: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  //onEdit,
  onDelete,
  onClick,
}) => {
  const { users } = useUserStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setAnchorEl(null);
  };

  // const handleEdit = (event: React.MouseEvent) => {
  //   event.stopPropagation();
  //   onEdit(project);
  //   handleMenuClose();
  // };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete(project);
    handleMenuClose();
  };

  const handleCardClick = () => {
    onClick(project.id);
  };

  const getProjectMembers = (memberIds: string[]) => {
    return memberIds
      .map((id) => users.find((user) => user.id === id))
      .filter(Boolean);
  };

  const projectOwner = users.find((user) => user.id === project.ownerId);

  return (
    <Card
      className="h-full cursor-pointer hover:shadow-lg transition-shadow relative"
      onClick={handleCardClick}
    >
      <CardContent className="h-full pb-4">
        <Box className="flex items-start justify-between mb-2">
          <Typography variant="h6" component="h2" className="flex-1 mr-2">
            {project.name}
          </Typography>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            className="opacity-70 hover:opacity-100"
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          className="mb-4 line-clamp-3"
        >
          {project.description}
        </Typography>

        <Box className="mt-auto">
          {projectOwner && (
            <Box className="flex items-center gap-2 mb-3">
              <Typography variant="caption" color="text.secondary">
                Owner:
              </Typography>
              <Box className="flex items-center gap-1">
                <Avatar
                  src={projectOwner.avatar}
                  alt={projectOwner.name}
                  sx={{ width: 20, height: 20 }}
                />
                <Typography variant="caption" color="text.primary">
                  {projectOwner.name}
                </Typography>
              </Box>
            </Box>
          )}

          <Box className="flex items-center justify-between">
            <Box className="flex items-center gap-2">
              <People fontSize="small" color="action" />
              <AvatarGroup max={3} className="ml-1">
                {getProjectMembers(project.memberIds).map((member) => (
                  <Avatar
                    key={member!.id}
                    src={member!.avatar}
                    alt={member!.name}
                    sx={{ width: 24, height: 24 }}
                  />
                ))}
              </AvatarGroup>
            </Box>

            <Chip
              label={`${project.memberIds.length} members`}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleMenuClose()}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleCardClick}>
          <ListItemIcon>
            <OpenInNew fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open Project</ListItemText>
        </MenuItem>
        {/* remove edit project option */}
        {/* <MenuItem onClick={handleEdit}>  
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Project</ListItemText>
        </MenuItem> */}
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Project</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default ProjectCard;
