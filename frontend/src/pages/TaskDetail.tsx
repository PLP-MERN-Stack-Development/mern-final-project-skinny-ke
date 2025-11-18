import { Box, Typography } from '@mui/material'

const TaskDetail = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4">Task Detail Page</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Task details and editing will be implemented here.
      </Typography>
    </Box>
  )
}

export default TaskDetail