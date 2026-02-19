import React from 'react';
import { X, Download, CheckCircle, Copy, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import { useLanguage } from '../../context/LanguageContext';

const CredentialsPopup = ({ 
  isOpen, 
  onClose, 
  schoolData, 
  managerData, 
  onDownloadPDF 
}) => {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !schoolData) return null;

  // Debug logging
  console.log('CredentialsPopup - schoolData:', schoolData);
  console.log('CredentialsPopup - managerData:', managerData);

  const handleCopyPassword = async () => {
    try {
      if (managerData?.password) {
        await navigator.clipboard.writeText(managerData.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Set up the document with professional styling
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Header with company branding
    doc.setFillColor(34, 139, 34); // Green background
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    // Company logo area (placeholder)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('WajibET', 20, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Educational Platform Management System', 20, 26);
    
    // Reset text color for content
    doc.setTextColor(0, 0, 0);
    
    // Document title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SCHOOL & MANAGER CREDENTIALS', 20, 45);
    
    // Add a line separator
    doc.setDrawColor(34, 139, 34);
    doc.setLineWidth(0.5);
    doc.line(20, 50, pageWidth - 20, 50);
    
    let yPosition = 60;
    
    // School Information Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SCHOOL INFORMATION', 20, yPosition);
    yPosition += 10;
    
    // School details in a professional format
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const schoolInfo = [
      { label: 'School Name:', value: schoolData?.name || 'N/A' },
      { label: 'Email Address:', value: schoolData?.contact?.email || 'Not provided' },
      { label: 'Phone Number:', value: schoolData?.contact?.phone || 'Not provided' },
      { label: 'Address:', value: schoolData?.contact?.address || 'Not provided' },
      { label: 'Account Status:', value: schoolData?.status?.toUpperCase() || 'N/A' }
    ];
    
    schoolInfo.forEach(info => {
      doc.setFont('helvetica', 'bold');
      doc.text(info.label, 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(info.value, 80, yPosition);
      yPosition += 8;
    });
    
    // Trial information if applicable
    if (schoolData?.status === 'trial' && schoolData?.trialExpiresAt) {
      const trialDate = new Date(schoolData.trialExpiresAt).toLocaleDateString();
      doc.setFont('helvetica', 'bold');
      doc.text('Trial Expires:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(trialDate, 80, yPosition);
      yPosition += 8;
    }
    
    yPosition += 15;
    
    // Manager Information Section
    if (managerData) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('MANAGER CREDENTIALS', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      const managerInfo = [
        { label: 'Full Name:', value: `${managerData?.firstName || ''} ${managerData?.lastName || ''}` },
        { label: 'Email Address:', value: managerData?.email || 'N/A' },
        { label: 'Address:', value: managerData?.address || 'N/A' },
        { label: 'Primary Phone:', value: managerData?.phone1 || 'N/A' }
      ];
      
      // Add password only if it exists
      if (managerData?.password) {
        managerInfo.splice(2, 0, { label: 'Login Password:', value: managerData.password });
      }
      
      managerInfo.forEach(info => {
        doc.setFont('helvetica', 'bold');
        doc.text(info.label, 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(info.value, 80, yPosition);
        yPosition += 8;
      });
      
      if (managerData?.phone2) {
        doc.setFont('helvetica', 'bold');
        doc.text('Secondary Phone:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(managerData.phone2, 80, yPosition);
        yPosition += 8;
      }
    } else {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('MANAGER INFORMATION', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('No manager was created for this school.', 20, yPosition);
      yPosition += 8;
      doc.text('A manager can be created later through the school management interface.', 20, yPosition);
      yPosition += 8;
    }
    
    // Important notice section
    yPosition += 20;
    doc.setFillColor(255, 248, 220); // Light yellow background
    doc.rect(15, yPosition - 5, pageWidth - 30, 25, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('IMPORTANT NOTICE:', 20, yPosition);
    yPosition += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.text('• Please save these credentials securely. They will not be shown again.', 20, yPosition);
    yPosition += 4;
    doc.text('• The manager can log in using their email and the provided password.', 20, yPosition);
    yPosition += 4;
    doc.text('• Contact support if you need assistance with account setup.', 20, yPosition);
    
    // Footer
    yPosition = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
    doc.text('WajibET Educational Platform', pageWidth - 80, yPosition);
    
    // Save the document
    const fileName = `school-credentials-${(schoolData?.name || 'school').replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    if (onDownloadPDF) {
      onDownloadPDF();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 text-white p-6 flex justify-between items-center">
          <div className="flex items-center">
            <CheckCircle className="mr-3" size={24} />
            <div>
              <h2 className="text-2xl font-bold">School Created Successfully!</h2>
              <p className="text-green-100">Here are the manager credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-green-700 p-2 rounded"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* School Summary */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-3">School Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {schoolData?.name || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {schoolData?.status || 'N/A'}
                  {schoolData?.status === 'trial' && schoolData?.trialExpiresAt && (
                    <span className="text-gray-600">
                      {' '}(Expires: {new Date(schoolData.trialExpiresAt).toLocaleDateString()})
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {schoolData?.contact?.email || 'Not provided'}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {schoolData?.contact?.phone || 'Not provided'}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium">Address:</span> {schoolData?.contact?.address || 'Not provided'}
                </div>
              </div>
          </div>

          {/* Manager Credentials */}
          {managerData ? (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-3">Manager Credentials</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {managerData?.firstName || ''} {managerData?.lastName || ''}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {managerData?.email || 'N/A'}
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium">Address:</span> {managerData?.address || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Primary Phone:</span> {managerData?.phone1 || 'N/A'}
                  </div>
                  {managerData?.phone2 && (
                    <div>
                      <span className="font-medium">Secondary Phone:</span> {managerData.phone2}
                    </div>
                  )}
                </div>
                
                {/* Password Section */}
                {managerData?.password && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-medium text-red-800">Password:</span>
                        <div className="flex items-center mt-1">
                          <span className="font-mono text-lg">
                            {showPassword ? (managerData?.password || '') : '•'.repeat(managerData?.password?.length || 0)}
                          </span>
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="ml-2 p-1 hover:bg-red-100 rounded"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleCopyPassword}
                      className={`ml-4 px-3 py-1 rounded text-sm font-medium ${
                        copied 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {copied ? (
                        <>
                          <CheckCircle size={14} className="inline mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={14} className="inline mr-1" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
                )}
                
                {!managerData?.password && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-center">
                      <AlertTriangle className="text-yellow-600 mr-2" size={16} />
                      <span className="text-yellow-800 text-sm">
                        Manager account created but password was not generated. Please contact support.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Manager Creation Skipped</h3>
              <p className="text-gray-600 text-sm">
                No manager was created for this school. You can create a manager later through the school management interface.
              </p>
            </div>
          )}

          {/* Important Notice */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2">Important Notice</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Save these credentials in a secure location</li>
              <li>• The manager should change their password on first login</li>
              <li>• Download the PDF for your records</li>
              <li>• These credentials will not be shown again</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Done
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <Download className="mr-2" size={16} />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default CredentialsPopup;
