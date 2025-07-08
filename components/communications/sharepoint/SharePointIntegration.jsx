import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { useSupervisorSession } from '../../hooks/useSupervisorSession';
import { DesignSystem } from '../../../design-system/design-system-spec';

const SharePointIntegration = ({ isVisible = true, onClose, visible = true }) => {
  const { supervisor } = useSupervisorSession();
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  
  // Browse state
  const [libraries, setLibraries] = useState([]);
  const [currentFiles, setCurrentFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Recent files
  const [recentFiles, setRecentFiles] = useState([]);
  
  // Upload state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadContent, setUploadContent] = useState('');

  const actuallyVisible = visible !== undefined ? visible : isVisible;

  // Check authentication status
  useEffect(() => {
    if (actuallyVisible) {
      checkAuthentication();
    }
  }, [actuallyVisible]);

  const checkAuthentication = async () => {
    const storedToken = localStorage.getItem('sharepoint_access_token');
    if (storedToken) {
      setAccessToken(storedToken);
      setAuthenticated(true);
      loadLibraries(storedToken);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://go-barry.onrender.com/api/communications/microsoft/auth-url');
      const data = await response.json();
      
      if (data.success) {
        // Open Microsoft login in new window
        const authWindow = window.open(data.authUrl, 'SharePoint Login', 'width=600,height=700');
        
        // Listen for auth callback
        window.addEventListener('message', handleAuthCallback);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate login');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthCallback = async (event) => {
    if (event.data.type === 'auth-callback' && event.data.code) {
      try {
        const response = await fetch('https://go-barry.onrender.com/api/communications/microsoft/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: event.data.code })
        });
        
        const data = await response.json();
        if (data.success) {
          const token = event.data.accessToken;
          setAccessToken(token);
          setAuthenticated(true);
          localStorage.setItem('sharepoint_access_token', token);
          loadLibraries(token);
        }
      } catch (error) {
        Alert.alert('Error', 'Authentication failed');
      }
    }
  };

  const loadLibraries = async (token) => {
    try {
      setLoading(true);
      const response = await fetch('https://go-barry.onrender.com/api/communications/sharepoint/libraries', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setLibraries(data.libraries);
      }
    } catch (error) {
      console.error('Error loading libraries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (libraryId, folderPath = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        libraryId,
        folderPath
      });
      
      const response = await fetch(`https://go-barry.onrender.com/api/communications/sharepoint/files?${params}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setCurrentFiles(data.items);
        setCurrentPath(folderPath);
        setSelectedLibrary(libraryId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://go-barry.onrender.com/api/communications/sharepoint/files/recent', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setRecentFiles(data.files);
      }
    } catch (error) {
      console.error('Error loading recent files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({ query: searchQuery });
      
      const response = await fetch(`https://go-barry.onrender.com/api/communications/sharepoint/search?${params}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (error) {
      Alert.alert('Error', 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (file) => {
    if (file.type === 'folder') {
      const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      loadFiles(selectedLibrary, newPath);
    } else if (Platform.OS === 'web') {
      // Open file in new tab
      window.open(file.webUrl, '_blank');
    }
  };

  const handleUpload = async () => {
    if (!uploadFileName || !uploadContent) {
      Alert.alert('Error', 'Please provide file name and content');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('https://go-barry.onrender.com/api/communications/sharepoint/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          fileName: uploadFileName,
          content: uploadContent,
          folderPath: currentPath,
          metadata: {
            CreatedBy: supervisor.name,
            Department: 'Traffic Control'
          }
        })
      });
      
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'File uploaded successfully');
        setUploadModalVisible(false);
        setUploadFileName('');
        setUploadContent('');
        loadFiles(selectedLibrary, currentPath);
      }
    } catch (error) {
      Alert.alert('Error', 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!actuallyVisible) return null;

  return (
    <Modal
      visible={actuallyVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>SharePoint Integration</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {!authenticated ? (
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                Connect to SharePoint to access team documents and reports
              </Text>
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Connect to SharePoint</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'browse' && styles.activeTab]}
                  onPress={() => {
                    setActiveTab('browse');
                    if (libraries.length === 0) loadLibraries(accessToken);
                  }}
                >
                  <Text style={[styles.tabText, activeTab === 'browse' && styles.activeTabText]}>
                    Browse
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
                  onPress={() => {
                    setActiveTab('recent');
                    loadRecentFiles();
                  }}
                >
                  <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
                    Recent
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'search' && styles.activeTab]}
                  onPress={() => setActiveTab('search')}
                >
                  <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
                    Search
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content}>
                {loading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
                  </View>
                )}

                {activeTab === 'browse' && (
                  <View>
                    {!selectedLibrary ? (
                      <View>
                        <Text style={styles.sectionTitle}>Document Libraries</Text>
                        {libraries.map((library) => (
                          <TouchableOpacity
                            key={library.id}
                            style={styles.libraryItem}
                            onPress={() => loadFiles(library.id)}
                          >
                            <Text style={styles.libraryName}>📁 {library.name}</Text>
                            {library.description && (
                              <Text style={styles.libraryDescription}>{library.description}</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <View>
                        <View style={styles.breadcrumb}>
                          <TouchableOpacity onPress={() => setSelectedLibrary(null)}>
                            <Text style={styles.breadcrumbLink}>Libraries</Text>
                          </TouchableOpacity>
                          {currentPath && (
                            <Text style={styles.breadcrumbText}> / {currentPath}</Text>
                          )}
                        </View>

                        <TouchableOpacity
                          style={styles.uploadButton}
                          onPress={() => setUploadModalVisible(true)}
                        >
                          <Text style={styles.uploadButtonText}>📤 Upload File</Text>
                        </TouchableOpacity>

                        {currentFiles.map((file) => (
                          <TouchableOpacity
                            key={file.id}
                            style={styles.fileItem}
                            onPress={() => handleFileClick(file)}
                          >
                            <View style={styles.fileInfo}>
                              <Text style={styles.fileName}>
                                {file.type === 'folder' ? '📁' : '📄'} {file.name}
                              </Text>
                              <Text style={styles.fileDetails}>
                                {file.type === 'file' && formatFileSize(file.size)} • {formatDate(file.modified)}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {activeTab === 'recent' && (
                  <View>
                    <Text style={styles.sectionTitle}>Recent Files</Text>
                    {recentFiles.map((file) => (
                      <TouchableOpacity
                        key={file.id}
                        style={styles.fileItem}
                        onPress={() => Platform.OS === 'web' && window.open(file.webUrl, '_blank')}
                      >
                        <View style={styles.fileInfo}>
                          <Text style={styles.fileName}>📄 {file.name}</Text>
                          <Text style={styles.fileDetails}>
                            {formatFileSize(file.size)} • {formatDate(file.modified)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {activeTab === 'search' && (
                  <View>
                    <View style={styles.searchContainer}>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search files..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                      />
                      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                        <Text style={styles.searchButtonText}>Search</Text>
                      </TouchableOpacity>
                    </View>

                    {searchResults.length > 0 && (
                      <View>
                        <Text style={styles.sectionTitle}>Search Results</Text>
                        {searchResults.map((file) => (
                          <TouchableOpacity
                            key={file.id}
                            style={styles.fileItem}
                            onPress={() => Platform.OS === 'web' && window.open(file.webUrl, '_blank')}
                          >
                            <View style={styles.fileInfo}>
                              <Text style={styles.fileName}>📄 {file.name}</Text>
                              <Text style={styles.fileDetails}>
                                {formatFileSize(file.size)} • {formatDate(file.modified)}
                              </Text>
                              {file.summary && (
                                <Text style={styles.fileSummary}>{file.summary}</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            </>
          )}

          {/* Upload Modal */}
          <Modal
            visible={uploadModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setUploadModalVisible(false)}
          >
            <View style={styles.uploadModalOverlay}>
              <View style={styles.uploadModalContent}>
                <Text style={styles.uploadModalTitle}>Upload File</Text>
                
                <TextInput
                  style={styles.uploadInput}
                  placeholder="File name (e.g., report.pdf)"
                  value={uploadFileName}
                  onChangeText={setUploadFileName}
                />
                
                <TextInput
                  style={[styles.uploadInput, styles.uploadContentInput]}
                  placeholder="File content (paste text or base64)"
                  value={uploadContent}
                  onChangeText={setUploadContent}
                  multiline
                />
                
                <View style={styles.uploadModalButtons}>
                  <TouchableOpacity
                    style={[styles.uploadModalButton, styles.cancelButton]}
                    onPress={() => setUploadModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.uploadModalButton, styles.confirmButton]}
                    onPress={handleUpload}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.confirmButtonText}>Upload</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '90%',
    maxWidth: 800,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: DesignSystem.colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: DesignSystem.colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  libraryItem: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  libraryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  libraryDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  breadcrumb: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  breadcrumbLink: {
    color: DesignSystem.colors.primary,
    fontSize: 14,
  },
  breadcrumbText: {
    color: '#666',
    fontSize: 14,
  },
  uploadButton: {
    backgroundColor: DesignSystem.colors.status.success,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  fileItem: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  fileDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  fileSummary: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  uploadModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadModalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    maxWidth: 500,
  },
  uploadModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  uploadInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  uploadContentInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  uploadModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  uploadModalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
  },
  confirmButton: {
    backgroundColor: DesignSystem.colors.primary,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default SharePointIntegration;
