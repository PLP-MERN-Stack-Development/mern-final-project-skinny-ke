import { Box, Typography } from '@mui/material'

const Profile = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4">Profile Page</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        User profile management will be implemented here.
      </Typography>
    </Box>
  )
}

export default Profile