import React from 'react'
import { useNotification } from '../../context/NotificationContext'
import FlashNotification from './FlashNotification'

const FlashContainer = () => {
  const { notifications, removeNotification } = useNotification()

  if (notifications.length === 0) {
    return null
  }

  return (
    <div 
      id="flash-messages-container" 
      className="flash-messages-container position-fixed top-0 end-0 p-3" 
      style={{ zIndex: 1050 }}
    >
      {notifications.map(notification => (
        <FlashNotification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => removeNotification(notification.id)}
          autoClose={notification.duration !== 0}
          duration={notification.duration || 5000}
        />
      ))}
    </div>
  )
}

export default FlashContainer