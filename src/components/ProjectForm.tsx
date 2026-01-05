import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
} from '@mui/material';
import { useUserStore } from '../stores/userStore';
import type { Project } from '../types';

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Project | null;
  mode: 'create' | 'edit';
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  const { users } = useUserStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ownerId: '',
    memberIds: [] as string[],
  });

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        ownerId: initialData.ownerId,
        memberIds: initialData.memberIds,
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        ownerId: users[0]?.id || '',
        memberIds: [],
      });
    }
  }, [initialData, mode, users, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.ownerId) {
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
      ownerId: formData.ownerId,
      memberIds: formData.memberIds,
    });

    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      ownerId: '',
      memberIds: [],
    });
    onClose();
  };

  const handleMemberChange = (event: any) => {
    const value = event.target.value;
    setFormData({
      ...formData,
      memberIds: typeof value === 'string' ? value.split(',') : value,
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === 'create' ? 'Create New Project' : 'Edit Project'}
        </DialogTitle>

        <DialogContent>
          <Box className="space-y-4 pt-2">
            <TextField
              fullWidth
              label="Project Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              variant="outlined"
            />

            <FormControl fullWidth required>
              <InputLabel>Project Owner</InputLabel>
              <Select
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                label="Project Owner"
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Team Members</InputLabel>
              <Select
                multiple
                value={formData.memberIds}
                onChange={handleMemberChange}
                input={<OutlinedInput label="Team Members" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const user = users.find(u => u.id === value);
                      return (
                        <Chip
                          key={value}
                          label={user?.name || value}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {mode === 'create' && (
              <Typography variant="body2" color="text.secondary">
                Note: The project owner will automatically be added as a team member.
              </Typography>
            )}
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
            disabled={!formData.name.trim() || !formData.ownerId}
          >
            {mode === 'create' ? 'Create Project' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProjectForm;