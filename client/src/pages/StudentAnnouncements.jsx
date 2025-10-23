import React from 'react';
import ClassAnnouncements from '../components/student/ClassAnnouncements';
import { AuthContext } from '../context/AuthContext';
import { MessageSquare, User, AlertCircle } from 'lucide-react';

const StudentAnnouncements = () => {
  const { user } = React.useContext(AuthContext);
  const classId = user?.class || user?.classes?.[0]?._id || user?.school; // best effort fallback

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Class Announcements</h1>
                <p className="text-sm text-gray-500">Stay updated with class notifications</p>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        {classId ? (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <ClassAnnouncements classId={classId} />
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Class Selected</h3>
              <p className="text-sm text-gray-500 max-w-md">
                You don't have a class assigned yet. Please contact your administrator to get enrolled in a class.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnnouncements;