import React from 'react';

const TeamNotifications = ({ teamId }) => {
  return (
    <div>
      <button aria-label="Notifications">
        <span>🔔</span>
        <span>2</span>
      </button>
      <div>
        <h2>Notifications</h2>
        <p>You were assigned to "Implement user authentication"</p>
        <p>Jane Smith mentioned you in "Design mobile UI"</p>
      </div>
    </div>
  );
};

export default TeamNotifications;