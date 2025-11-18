import { Box, Typography } from '@mui/material'

const Settings = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4">Settings Page</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Application settings and preferences will be implemented here.
      </Typography>
    </Box>
  )
}

export default Settings