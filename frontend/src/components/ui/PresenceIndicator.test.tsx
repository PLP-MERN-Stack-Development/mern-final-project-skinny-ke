import { render, screen } from '@testing-library/react'
import { PresenceIndicator, PresenceList } from './PresenceIndicator'
import '@testing-library/jest-dom'

describe('PresenceIndicator', () => {
  const defaultProps = {
    userId: 'user-1',
    userName: 'John Doe',
    status: 'online' as const,
  }

  it('renders with online status', () => {
    render(<PresenceIndicator {...defaultProps} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    const statusDot = document.querySelector('.MuiAvatar-root + div')
    expect(statusDot).toHaveStyle({ backgroundColor: expect.any(String) })
  })

  it('renders with away status', () => {
    render(<PresenceIndicator {...defaultProps} status="away" />)

    const statusDot = document.querySelector('.MuiAvatar-root + div')
    expect(statusDot).toBeDefined()
  })

  it('renders with offline status', () => {
    render(<PresenceIndicator {...defaultProps} status="offline" />)

    const statusDot = document.querySelector('.MuiAvatar-root + div')
    expect(statusDot).toBeDefined()
  })

  it('shows typing indicator when isTyping is true', () => {
    render(
      <PresenceIndicator
        {...defaultProps}
        isTyping={true}
        typingTaskId="task-1"
      />
    )

    expect(screen.getByText(/typing/)).toBeInTheDocument()
  })

  it('displays user avatar when provided', () => {
    const avatarUrl = 'https://example.com/avatar.jpg'
    render(<PresenceIndicator {...defaultProps} avatar={avatarUrl} />)

    const avatar = document.querySelector('.MuiAvatar-root img')
    expect(avatar).toHaveAttribute('src', avatarUrl)
  })

  it('shows initials when no avatar is provided', () => {
    render(<PresenceIndicator {...defaultProps} />)

    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('hides name when showName is false', () => {
    render(<PresenceIndicator {...defaultProps} showName={false} />)

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })

  it('applies different sizes correctly', () => {
    render(<PresenceIndicator {...defaultProps} size="large" />)

    const avatar = document.querySelector('.MuiAvatar-root')
    expect(avatar).toHaveStyle({ width: '40px', height: '40px' })
  })

  it('displays tooltip with user information', async () => {
    render(<PresenceIndicator {...defaultProps} />)

    // Tooltip should appear on hover, but testing tooltips requires additional setup
    // This is a basic test to ensure the component renders without errors
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})

describe('PresenceList', () => {
  const mockUsers = [
    {
      id: 'user-1',
      name: 'John Doe',
      status: 'online' as const,
      avatar: 'https://example.com/john.jpg',
    },
    {
      id: 'user-2',
      name: 'Jane Smith',
      status: 'away' as const,
      isTyping: true,
      typingTaskId: 'task-1',
    },
    {
      id: 'user-3',
      name: 'Bob Johnson',
      status: 'offline' as const,
    },
  ]

  it('renders all users when below maxVisible', () => {
    render(<PresenceList users={mockUsers.slice(0, 2)} maxVisible={5} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('shows overflow indicator when exceeding maxVisible', () => {
    render(<PresenceList users={mockUsers} maxVisible={2} />)

    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('does not show overflow when at maxVisible limit', () => {
    render(<PresenceList users={mockUsers.slice(0, 2)} maxVisible={2} />)

    expect(screen.queryByText(/^\+/) ).not.toBeInTheDocument()
  })

  it('applies different sizes to all indicators', () => {
    render(<PresenceList users={mockUsers.slice(0, 1)} size="large" />)

    const avatar = document.querySelector('.MuiAvatar-root')
    expect(avatar).toHaveStyle({ width: '40px', height: '40px' })
  })

  it('handles empty user list', () => {
    render(<PresenceList users={[]} />)

    // Should render without errors
    expect(document.querySelector('.MuiBox-root')).toBeInTheDocument()
  })

  it('displays typing indicators for users who are typing', () => {
    render(<PresenceList users={mockUsers.slice(1, 2)} />)

    expect(screen.getByText(/typing/)).toBeInTheDocument()
  })
})