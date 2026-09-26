import React from 'react';
import { motion } from 'framer-motion';
import { UserMinusIcon } from '@heroicons/react/24/outline';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';

const TeamMembersList = ({ members, onRemoveMember }) => {
  // Handle case where members might be undefined or not an array
  const memberList = Array.isArray(members) ? members : [];
  
  // //console.log('   [TeamMembersList] Received members:', members);
  // //console.log('   [TeamMembersList] memberList:', memberList);
  // //console.log('   [TeamMembersList] memberList.length:', memberList.length);

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-6">
      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
        Team Members
      </h3>

      <div className="space-y-3">
        {memberList.length > 0 ? (
          memberList.map((member, index) => {
            // Handle both populated user objects and user IDs
            const userObj = member.user || member;
            const userId = typeof userObj === 'object' ? (userObj._id || userObj.id) : userObj;
            const userFullname = typeof userObj === 'object' ? (userObj.fullname || userObj.name || 'Unknown') : 'Unknown';
            const userUsername = typeof userObj === 'object' ? (userObj.username || 'unknown') : 'unknown';
            const userAvatar = typeof userObj === 'object' ? userObj.avatar : null;

            // //console.log('  [TeamMembersList] Rendering member:', { userId, userFullname, userUsername, member });

            return (
              <motion.div
                key={userId || `member-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-900 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Avatar
                    src={userAvatar}
                    name={userFullname}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-secondary-900 dark:text-secondary-100 truncate">
                      {userFullname}
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                      @{userUsername}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {/* Role Badge */}
                  <Badge variant="secondary" size="sm">
                    {member.role}
                  </Badge>

                  {/* Task Count */}
                  <div className="text-xs text-secondary-600 dark:text-secondary-400 px-2 py-1 bg-secondary-200 dark:bg-secondary-700 rounded">
                    {member.completedTaskCount || 0}/{member.taskCount || 0}
                  </div>

                  {/* Remove Button */}
                  {onRemoveMember && member.role !== 'owner' && (
                    <button
                      onClick={() => onRemoveMember(userId)}
                      className="p-1 text-secondary-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Remove member"
                    >
                      <UserMinusIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-6">
            <p className="text-secondary-500 dark:text-secondary-400">
              No team members yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamMembersList;
