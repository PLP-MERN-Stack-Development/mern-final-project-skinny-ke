import { Box, Typography } from '@mui/material'

const Workspace = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4">Workspace Page</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Workspace details and task management will be implemented here.
      </Typography>
    </Box>
  )
}

export default Workspace