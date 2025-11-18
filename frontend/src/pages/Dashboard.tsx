import { Box, Typography, Grid, Card, CardContent } from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AssignmentLate as AssignmentLateIcon,
  Group as GroupIcon,
} from '@mui/icons-material'

import LoadingSpinner from '@/components/ui/LoadingSpinner'

const Dashboard = () => {
  // Mock data - will be replaced with real data from API
  const stats = [
    {
      title: 'Total Tasks',
      value: 45,
      icon: <CheckCircleIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      change: '+12%',
      changeColor: 'success.main',
    },
    {
      title: 'Completed Today',
      value: 8,
      icon: <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      change: '+25%',
      changeColor: 'success.main',
    },
    {
      title: 'Due This Week',
      value: 12,
      icon: <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      change: '-5%',
      changeColor: 'error.main',
    },
    {
      title: 'Overdue',
      value: 3,
      icon: <AssignmentLateIcon sx={{ fontSize: 40, color: 'error.main' }} />,
      change: '+2',
      changeColor: 'error.main',
    },
  ]

  const recentTasks = [
    {
      id: 1,
      title: 'Design new landing page',
      status: 'In Progress',
      assignee: 'John Doe',
      dueDate: 'Nov 20, 2024',
    },
    {
      id: 2,
      title: 'Implement user authentication',
      status: 'Review',
      assignee: 'Sarah Smith',
      dueDate: 'Nov 18, 2024',
    },
    {
      id: 3,
      title: 'API documentation',
      status: 'Todo',
      assignee: 'Mike Johnson',
      dueDate: 'Nov 22, 2024',
    },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {stat.icon}
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h6" component="div">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: stat.changeColor, fontWeight: 600 }}
                >
                  {stat.change} from last week
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Tasks */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Tasks
          </Typography>
          <Box sx={{ mt: 2 }}>
            {recentTasks.map((task) => (
              <Box
                key={task.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': {
                    borderBottom: 'none',
                  },
                }}
              >
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {task.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assigned to {task.assignee}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        task.status === 'Completed'
                          ? 'success.main'
                          : task.status === 'In Progress'
                          ? 'warning.main'
                          : 'text.secondary',
                      fontWeight: 500,
                    }}
                  >
                    {task.status}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Due {task.dueDate}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Dashboard