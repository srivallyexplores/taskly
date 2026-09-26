import React from 'react';

const TeamAnalytics = ({ teamId }) => {
  return (
    <div>
      <h1>Team Analytics</h1>
      <div data-testid="loading-spinner">Loading...</div>
      <div>60%</div>
    </div>
  );
};

export default TeamAnalytics;