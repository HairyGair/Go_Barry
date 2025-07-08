import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useSupervisorSession } from '../hooks/useSupervisorSession';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

// Note: You'll need to install react-pdf
// Run: npm install react-pdf@latest
// Then uncomment the import below:
// import { Document, Page, pdfjs } from 'react-pdf';
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DutyBoards = () => {
  const { supervisorSession } = useSupervisorSession();
  const supervisor = supervisorSession?.supervisor;
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Convex queries and mutations
  const currentDutyBoard = useQuery(api.dutyBoards.getCurrentDutyBoard);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const createDutyBoardWithStorage = useMutation(api.dutyBoards.createDutyBoardWithStorage);

  // Handle drag over
  const handleDragOver = (e) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    }
  };

  // Handle drag leave
  const handleDragLeave = (e) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    }
  };

  // Handle file drop
  const handleDrop = async (e) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFileUpload(files[0]);
      }
    }
  };

  // Handle file upload using Convex storage
  const handleFileUpload = async (file) => {
    console.log('File upload started:', file.name, file.size, file.type);
    
    if (!file || file.type !== 'application/pdf') {
      Alert.alert('Error', 'Please upload a PDF file');
      return;
    }

    if (!supervisor) {
      console.error('No supervisor logged in:', supervisor);
      Alert.alert('Error', 'You must be logged in to upload duty boards');
      return;
    }

    // Check file size (Convex has a 128MB limit per file)
    const maxSize = 50 * 1024 * 1024; // 50MB to be safe
    if (file.size > maxSize) {
      Alert.alert('Error', 'File too large. Maximum size is 50MB');
      return;
    }

    setIsUploading(true);
    try {
      // Step 1: Get an upload URL from Convex
      console.log('Getting upload URL...');
      const uploadUrl = await generateUploadUrl();
      
      if (!uploadUrl) {
        throw new Error('Failed to get upload URL');
      }

      // Step 2: Upload the file to Convex storage
      console.log('Uploading file to storage...');
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      const { storageId } = await uploadResponse.json();
      console.log('File uploaded to storage:', storageId);

      // Step 3: Create duty board record with storage ID
      const result = await createDutyBoardWithStorage({
        fileName: file.name,
        storageId: storageId,
        uploadedBy: supervisor.name,
        uploadedById: supervisor.backendId || supervisor.badge || supervisor.id || 'unknown',
        fileSize: file.size,
      });
      
      console.log('Duty board created:', result);
      Alert.alert('Success', 'Duty board uploaded successfully');
      setIsUploading(false);
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', `Failed to upload: ${error.message}`);
      setIsUploading(false);
    }
  };

  // File input change handler
  const handleFileInputChange = (e) => {
    console.log('File input change event:', e.target.files);
    if (Platform.OS === 'web' && e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Compact Header with Find */}
      {currentDutyBoard && (
        <View style={styles.compactHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.currentFile}>
              {currentDutyBoard.fileName} • Uploaded by {currentDutyBoard.uploadedBy} on {new Date(currentDutyBoard.uploadedAt).toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.findHint}
            onPress={() => {
              Alert.alert(
                'Find Text in PDF',
                'Click inside the PDF viewer and press:\n\n• Windows/Linux: Ctrl + F\n• Mac: Cmd + F\n\nThen type your search term (e.g. "ft 1234")'
              );
            }}
          >
            <Text style={styles.findHintText}>💡 Find Text</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content Area */}
      {currentDutyBoard ? (
        <View style={styles.pdfContainer}>
          {/* PDF Viewer */}
          {currentDutyBoard.fileUrl ? (
            // If we have a storage URL, show iframe for web
            Platform.OS === 'web' ? (
              <iframe
                src={currentDutyBoard.fileUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                title="Duty Board PDF"
              />
            ) : (
              <View style={styles.pdfPlaceholder}>
                <Text style={styles.placeholderText}>
                  PDF viewing on mobile coming soon
                </Text>
                <Text style={styles.placeholderSubtext}>
                  View on web for full PDF experience
                </Text>
              </View>
            )
          ) : currentDutyBoard.fileData ? (
            // Legacy base64 support
            <View style={styles.pdfPlaceholder}>
              <Text style={styles.placeholderText}>
                Legacy PDF format - please re-upload
              </Text>
            </View>
          ) : (
            // No file data
            <View style={styles.pdfPlaceholder}>
              <Text style={styles.placeholderText}>
                PDF data not available
              </Text>
            </View>
          )}

          {/* PDF controls are handled by the browser's built-in viewer */}
        </View>
      ) : (
        // Upload Area
        <View
          style={[styles.uploadArea, isDragging && styles.uploadAreaDragging]}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <ActivityIndicator size="large" color="#003366" />
          ) : (
            <>
              <Text style={styles.uploadText}>
                Drag and drop a PDF file here
              </Text>
              <Text style={styles.uploadSubtext}>or</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => {
                  console.log('Choose file button clicked');
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  } else {
                    console.error('File input ref is null');
                  }
                }}
              >
                <Text style={styles.uploadButtonText}>Choose File</Text>
              </TouchableOpacity>
              
              {Platform.OS === 'web' && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />
              )}
            </>
          )}
        </View>
      )}

      {/* Replace Current File Button */}
      {currentDutyBoard && supervisor && (
        <TouchableOpacity
          style={styles.replaceButton}
          onPress={() => {
            console.log('Replace button clicked');
            if (fileInputRef.current) {
              fileInputRef.current.click();
            } else {
              console.error('File input ref is null');
            }
          }}
        >
          <Text style={styles.replaceButtonText}>
            Replace Current Duty Board
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  compactHeader: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
    marginRight: 15,
  },
  currentFile: {
    fontSize: 13,
    color: '#666',
  },
  findHint: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f7ff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d0e3ff',
  },
  findHintText: {
    fontSize: 13,
    color: '#003366',
    fontWeight: '500',
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: 'white',
    margin: 8,
    marginTop: 0,
    borderRadius: 4,
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }),
  },
  pdfPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  uploadArea: {
    flex: 1,
    margin: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  uploadAreaDragging: {
    borderColor: '#003366',
    backgroundColor: '#f0f7ff',
  },
  uploadText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#999',
    marginVertical: 10,
  },
  uploadButton: {
    backgroundColor: '#003366',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 5,
    marginTop: 10,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  replaceButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#ff6600',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 5,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    }),
  },
  replaceButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default DutyBoards;
