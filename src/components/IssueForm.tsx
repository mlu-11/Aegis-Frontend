import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import { useUserStore } from "../stores/userStore";
import { useSprintStore } from "../stores/sprintStore";
import { api } from "../utils/api";
import type {
  Issue,
  IssueType,
  IssueStatus,
  Priority,
  CustomField,
} from "../types";

export interface IssueFormData {
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  priority: Priority;
  assigneeId?: string;
  reporterId: string;
  projectId: string;
  sprintId?: string;
  estimatedHours?: number;
  progress?: number;
  customFields?: CustomField[];
  // dependencies?: string[];
  dependencies?: { issueId: string; note?: string }[];
}

interface IssueFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (issueData: IssueFormData) => void;
  initialData?: Issue | null;
  mode: "create" | "edit";
  projectId: string;
}

const IssueForm: React.FC<IssueFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  projectId,
}) => {
  const { users, currentUser } = useUserStore();
  const { getSprintsByProject } = useSprintStore();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "TASK" as IssueType,
    status: "TO_DO" as IssueStatus,
    priority: "MEDIUM" as Priority,
    assigneeId: "",
    reporterId: currentUser?.id || "",
    projectId: projectId,
    sprintId: "",
    estimatedHours: 0,
    progress: 0,
    customFields: [] as CustomField[],
    //dependencies: [] as string[],
    dependencies: [] as { issueId: string; note?: string }[],
  });

  const [availableUserStories, setAvailableUserStories] = useState<Issue[]>([]);
  const [loadingUserStories, setLoadingUserStories] = useState(false);

  const projectSprints = getSprintsByProject(projectId);
  const availableSprints = projectSprints.filter(
    (sprint) => sprint.status !== "COMPLETED"
  );

  const fetchUserStories = async () => {
    if (formData.type !== "USER_STORY") {
      setAvailableUserStories([]);
      return;
    }

    setLoadingUserStories(true);
    try {
      const excludeId = initialData?.id || "";
      const userStories = await api.get(
        `/issues/user-stories?projectId=${projectId}&excludeId=${excludeId}`
      );

      const mappedStories = userStories.map((story: any) => ({
        ...story,
        id: story._id,
        createdAt: new Date(story.createdAt),
        updatedAt: new Date(story.updatedAt),
      }));

      // 在编辑模式下，如果当前 issue 有 dependencies，需要确保这些 dependencies 也在 availableUserStories 中
      // if (mode === "edit" && initialData?.dependencies) {
      //   const existingDependencies = initialData.dependencies.filter(
      //     (dep: Issue) =>
      //       !mappedStories.some((story: Issue) => story.id === dep.id)
      //   );
      //   mappedStories.push(...existingDependencies);
      // }

      if (mode === "edit" && initialData?.dependencies) {
        // If backend still returns populated Issue[] for dependencies, keep old behavior
        const depsAny = initialData.dependencies as any[];

        const populatedIssues = depsAny.filter(
          (d) => d && typeof d === "object" && "id" in d && "title" in d
        );

        const missingPopulated = populatedIssues.filter(
          (dep: any) =>
            !mappedStories.some((story: Issue) => story.id === dep.id)
        );

        mappedStories.push(...missingPopulated);
      }

      setAvailableUserStories(mappedStories);
    } catch (error) {
      console.error("Failed to fetch user stories:", error);
      setAvailableUserStories([]);
    } finally {
      setLoadingUserStories(false);
    }
  };

  useEffect(() => {
    fetchUserStories();
  }, [formData.type, projectId, initialData?.id]);

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        type: initialData.type,
        status: initialData.status,
        priority: initialData.priority,
        assigneeId: initialData.assigneeId || "",
        reporterId: initialData.reporterId,
        projectId: initialData.projectId,
        sprintId: initialData.sprintId || "",
        estimatedHours: initialData.estimatedHours || 0,
        progress: initialData.progress || 0,
        customFields: initialData.customFields || [],
        //dependencies: initialData.dependencies?.map((dep) => dep.id) || [],
        dependencies:
          initialData.dependencies?.map((dep) => ({
            issueId: dep.issueId,
            note: dep.note ?? "",
          })) || [],
      });
    } else if (mode === "create") {
      setFormData({
        title: "",
        description: "",
        type: "TASK",
        status: "TO_DO",
        priority: "MEDIUM",
        assigneeId: "",
        reporterId: currentUser?.id || "",
        projectId: projectId,
        sprintId: "",
        estimatedHours: 0,
        progress: 0,
        customFields: [],
        dependencies: [],
      });
    }
  }, [initialData, mode, projectId, currentUser, open]);

  // dependencies

  //dependencies helper
  const updateDependencyNote = (issueId: string, note: string) => {
    setFormData((prev) => ({
      ...prev,
      dependencies: prev.dependencies.map((d) =>
        d.issueId === issueId ? { ...d, note } : d
      ),
    }));
  };

  const selectedDepIds = formData.dependencies.map((d) => d.issueId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.reporterId) {
      return;
    }

    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      status: formData.status,
      priority: formData.priority,
      assigneeId: formData.assigneeId || undefined,
      reporterId: formData.reporterId,
      projectId: formData.projectId,
      sprintId: formData.sprintId || undefined,
      estimatedHours: formData.estimatedHours || undefined,
      progress:
        formData.status === "IN_PROGRESS" ? formData.progress : undefined,
      customFields:
        formData.customFields.length > 0 ? formData.customFields : undefined,
      dependencies:
        formData.type === "USER_STORY" ? formData.dependencies : undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      type: "TASK",
      status: "TO_DO",
      priority: "MEDIUM",
      assigneeId: "",
      reporterId: currentUser?.id || "",
      projectId: projectId,
      sprintId: "",
      estimatedHours: 0,
      progress: 0,
      customFields: [],
      dependencies: [],
    });
    onClose();
  };

  const getIssueTypeColor = (type: IssueType) => {
    switch (type) {
      case "BUG":
        return "error";
      case "USER_STORY":
        return "primary";
      case "TASK":
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "URGENT":
        return "error";
      case "HIGH":
        return "warning";
      case "MEDIUM":
        return "info";
      case "LOW":
      default:
        return "default";
    }
  };

  const addCustomField = () => {
    setFormData({
      ...formData,
      customFields: [
        ...formData.customFields,
        { textField: "", description: "" },
      ],
    });
  };

  const removeCustomField = (index: number) => {
    setFormData({
      ...formData,
      customFields: formData.customFields.filter((_, i) => i !== index),
    });
  };

  const updateCustomField = (
    index: number,
    field: "textField" | "description",
    value: string
  ) => {
    const updatedFields = [...formData.customFields];
    updatedFields[index] = { ...updatedFields[index], [field]: value };
    setFormData({
      ...formData,
      customFields: updatedFields,
    });
  };

  const assignee = formData.assigneeId
    ? users.find((u) => u.id === formData.assigneeId)
    : null;
  const reporter = users.find((u) => u.id === formData.reporterId);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === "create" ? "Create New Issue" : "Edit Issue"}
        </DialogTitle>

        <DialogContent>
          <Box className="space-y-4 pt-2">
            <TextField
              fullWidth
              label="Issue Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              multiline
              rows={4}
              variant="outlined"
            />
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormControl fullWidth required>
                <InputLabel>Issue Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as IssueType,
                    })
                  }
                  label="Issue Type"
                  renderValue={(value) => (
                    <Box className="flex items-center gap-2">
                      <Chip
                        label={value.replace("_", " ")}
                        size="small"
                        color={getIssueTypeColor(value) as any}
                        variant="outlined"
                      />
                    </Box>
                  )}
                >
                  <MenuItem value="TASK">
                    <Chip
                      label="Task"
                      size="small"
                      color="default"
                      variant="outlined"
                    />
                  </MenuItem>
                  <MenuItem value="BUG">
                    <Chip
                      label="Bug"
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  </MenuItem>
                  <MenuItem value="USER_STORY">
                    <Chip
                      label="User Story"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as Priority,
                    })
                  }
                  label="Priority"
                  renderValue={(value) => (
                    <Box className="flex items-center gap-2">
                      <Chip
                        label={value}
                        size="small"
                        color={getPriorityColor(value) as any}
                        variant="outlined"
                      />
                    </Box>
                  )}
                >
                  <MenuItem value="LOW">
                    <Chip
                      label="Low"
                      size="small"
                      color="default"
                      variant="outlined"
                    />
                  </MenuItem>
                  <MenuItem value="MEDIUM">
                    <Chip
                      label="Medium"
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  </MenuItem>
                  <MenuItem value="HIGH">
                    <Chip
                      label="High"
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  </MenuItem>
                  <MenuItem value="URGENT">
                    <Chip
                      label="Urgent"
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as IssueStatus,
                    })
                  }
                  label="Status"
                >
                  <MenuItem value="TO_DO">To Do</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="DONE">Done</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Estimated Hours"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedHours: parseInt(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 0, step: 0.5 }}
                variant="outlined"
              />
            </Box>
            {formData.status === "IN_PROGRESS" && (
              <TextField
                fullWidth
                label="Progress (%)"
                type="number"
                value={formData.progress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    progress: parseInt(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 0, max: 100, step: 1 }}
                variant="outlined"
              />
            )}
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormControl fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select
                  value={formData.assigneeId}
                  onChange={(e) =>
                    setFormData({ ...formData, assigneeId: e.target.value })
                  }
                  label="Assignee"
                  renderValue={(value) => {
                    if (!value) return <em>Unassigned</em>;
                    const user = users.find((u) => u.id === value);
                    return user ? (
                      <Box className="flex items-center gap-2">
                        <Avatar
                          src={user.avatar}
                          sx={{ width: 24, height: 24 }}
                        />
                        {user.name}
                      </Box>
                    ) : (
                      value
                    );
                  }}
                >
                  <MenuItem value="">
                    <em>Unassigned</em>
                  </MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      <Box className="flex items-center gap-2">
                        <Avatar
                          src={user.avatar}
                          sx={{ width: 24, height: 24 }}
                        />
                        {user.name} ({user.email})
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Reporter</InputLabel>
                <Select
                  value={formData.reporterId}
                  onChange={(e) =>
                    setFormData({ ...formData, reporterId: e.target.value })
                  }
                  label="Reporter"
                  renderValue={(value) => {
                    const user = users.find((u) => u.id === value);
                    return user ? (
                      <Box className="flex items-center gap-2">
                        <Avatar
                          src={user.avatar}
                          sx={{ width: 24, height: 24 }}
                        />
                        {user.name}
                      </Box>
                    ) : (
                      value
                    );
                  }}
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      <Box className="flex items-center gap-2">
                        <Avatar
                          src={user.avatar}
                          sx={{ width: 24, height: 24 }}
                        />
                        {user.name} ({user.email})
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            {availableSprints.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>Sprint</InputLabel>
                <Select
                  value={formData.sprintId}
                  onChange={(e) =>
                    setFormData({ ...formData, sprintId: e.target.value })
                  }
                  label="Sprint"
                >
                  <MenuItem value="">
                    <em>Backlog (No Sprint)</em>
                  </MenuItem>
                  {availableSprints.map((sprint) => (
                    <MenuItem key={sprint.id} value={sprint.id}>
                      {sprint.name} ({sprint.status})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {formData.type === "USER_STORY" && (
              <Box className="space-y-4">
                <Box className="flex items-center gap-2">
                  <LinkIcon color="primary" />
                  <Typography variant="h6" component="h3">
                    Dependencies
                  </Typography>
                  {loadingUserStories && <CircularProgress size={16} />}
                </Box>

                <Autocomplete
                  multiple
                  options={availableUserStories}
                  getOptionLabel={(option) => option.title}
                  value={availableUserStories.filter((story) =>
                    selectedDepIds.includes(story.id)
                  )}
                  onChange={(_, newValue) => {
                    setFormData((prev) => {
                      const noteById = new Map(
                        prev.dependencies.map((d) => [d.issueId, d.note ?? ""])
                      );
                      return {
                        ...prev,
                        dependencies: newValue.map((story) => ({
                          issueId: story.id,
                          note: noteById.get(story.id) ?? "",
                        })),
                      };
                    });
                  }}
                  loading={loadingUserStories}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select User Stories"
                      placeholder="Choose dependencies..."
                      variant="outlined"
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box
                      component="li"
                      {...props}
                      className="flex items-center gap-2"
                    >
                      <Chip
                        label={option.type.replace("_", " ")}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Box className="flex-1">
                        <Typography variant="body2" className="font-medium">
                          {option.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.status} • {option.priority}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const tagProps = getTagProps({ index });
                      return (
                        <Chip
                          {...tagProps}
                          key={option.id}
                          label={option.title}
                          size="small"
                          color="primary"
                          variant="outlined"
                          deleteIcon={<DeleteIcon />}
                        />
                      );
                    })
                  }
                />

                {formData.dependencies.length > 0 && (
                  <Box className="space-y-1">
                    <Typography variant="caption" color="text.secondary">
                      {formData.dependencies.length} user stor
                      {formData.dependencies.length === 1 ? "y" : "ies"}{" "}
                      selected as dependencies
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      className="italic"
                    >
                      Each dependency can include a note explaining why it must
                      be completed first.
                    </Typography>
                  </Box>
                )}

                {/* ✅ Notes per dependency */}
                {formData.dependencies.length > 0 && (
                  <Box className="space-y-2">
                    {formData.dependencies.map((dep) => {
                      const story = availableUserStories.find(
                        (s) => s.id === dep.issueId
                      );
                      return (
                        <Box
                          key={dep.issueId}
                          className="p-3 border border-gray-200 rounded space-y-2"
                        >
                          <Typography variant="body2" className="font-medium">
                            {story?.title ?? dep.issueId}
                          </Typography>
                          <TextField
                            fullWidth
                            label="Dependency note"
                            placeholder="Why must this be completed first / what condition must be met?"
                            value={dep.note ?? ""}
                            onChange={(e) =>
                              updateDependencyNote(dep.issueId, e.target.value)
                            }
                            multiline
                            rows={2}
                            variant="outlined"
                          />
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            )}
            {/* */}

            {/* */}

            <Divider sx={{ my: 3 }} />
            <Box className="space-y-4">
              <Box className="flex items-center justify-between">
                <Typography variant="h6" component="h3">
                  Custom Fields
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addCustomField}
                  variant="outlined"
                  size="small"
                >
                  Add Field
                </Button>
              </Box>

              {formData.customFields.map((field, index) => (
                <Box
                  key={index}
                  className="space-y-2 p-3 border border-gray-200 rounded"
                >
                  <Box className="flex items-center justify-between">
                    <Typography variant="subtitle2" color="text.secondary">
                      Custom Field {index + 1}
                    </Typography>
                    <IconButton
                      onClick={() => removeCustomField(index)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <TextField
                    fullWidth
                    label="Field Value"
                    value={field.textField}
                    onChange={(e) =>
                      updateCustomField(index, "textField", e.target.value)
                    }
                    variant="outlined"
                    size="small"
                  />

                  <TextField
                    fullWidth
                    label="Field Description"
                    value={field.description}
                    onChange={(e) =>
                      updateCustomField(index, "description", e.target.value)
                    }
                    variant="outlined"
                    size="small"
                    multiline
                    rows={2}
                  />
                </Box>
              ))}
            </Box>
            <Box className="flex items-center gap-4 pt-2">
              {assignee && (
                <Box className="flex items-center gap-2">
                  <Typography variant="caption" color="text.secondary">
                    Assignee:
                  </Typography>
                  <Box className="flex items-center gap-1">
                    <Avatar
                      src={assignee.avatar}
                      sx={{ width: 20, height: 20 }}
                    />
                    <Typography variant="body2">{assignee.name}</Typography>
                  </Box>
                </Box>
              )}

              {reporter && (
                <Box className="flex items-center gap-2">
                  <Typography variant="caption" color="text.secondary">
                    Reporter:
                  </Typography>
                  <Box className="flex items-center gap-1">
                    <Avatar
                      src={reporter.avatar}
                      sx={{ width: 20, height: 20 }}
                    />
                    <Typography variant="body2">{reporter.name}</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!formData.title.trim() || !formData.reporterId}
          >
            {mode === "create" ? "Create Issue" : "Save Changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default IssueForm;
