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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useSupervisor } from '../hooks/useSupervisorSession';

const API_BASE = 'https://go-barry.onrender.com';

const LocalFileManager = ({ isVisible = true, onClose, visible = true }) => {
  const { supervisorName, supervisorId } = useSupervisor();
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(false);
  
  // Browse state
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Upload state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: 'general',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Stats
  const [stats, setStats] = useState(null);

  const actuallyVisible = visible !== undefined ? visible : isVisible;

  useEffect(() => {
    if (actuallyVisible) {
      loadDocuments();
      loadCategories();
      loadStats();
    }
  }, [actuallyVisible]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      
      const response = await fetch(`${API_BASE}/api/file-management/documents?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/file-management/categories`);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/file-management/stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({ search: searchQuery });
      
      const response = await fetch(`${API_BASE}/api/file-management/documents?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.documents);
      }
    } catch (error) {
      Alert.alert('Error', 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedFile(result.assets[0]);
        setUploadData(prev => ({
          ...prev,
          title: result.assets[0].name.replace(/\.[^/.]+$/, "") // Remove extension
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadData.title.trim()) {
      Alert.alert('Error', 'Please select a file and provide a title');
      return;
    }
    
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType,
        name: selectedFile.name,
      });
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('category', uploadData.category);
      formData.append('tags', uploadData.tags);
      formData.append('uploaded_by', supervisorName || supervisorId || 'Unknown');
      
      const response = await fetch(`${API_BASE}/api/file-management/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'File uploaded successfully');
        setUploadModalVisible(false);
        resetUploadForm();
        loadDocuments();
        loadStats();
      } else {
        Alert.alert('Error', data.error || 'Upload failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document) => {
    if (Platform.OS === 'web') {
      // For web, open in new tab
      window.open(`${API_BASE}/api/file-management/download/${document.id}`, '_blank');
    } else {
      Alert.alert('Info', 'File download will open in your default app');
      // For mobile, could implement actual download
    }
  };

  const handleDeleteDocument = async (document) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(`${API_BASE}/api/file-management/documents/${document.id}`, {
                method: 'DELETE',
              });
              
              const data = await response.json();
              
              if (data.success) {
                Alert.alert('Success', 'Document deleted successfully');
                loadDocuments();
                loadStats();
              } else {
                Alert.alert('Error', data.error || 'Delete failed');
              }
            } catch (error) {
              Alert.alert('Error', 'Delete failed');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const resetUploadForm = () => {
    setUploadData({
      title: '',
      description: '',
      category: 'general',
      tags: ''
    });
    setSelectedFile(null);
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
            <Text style={styles.title}>Document Manager</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          {stats && (
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalDocuments}</Text>
                <Text style={styles.statLabel}>Documents</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatFileSize(stats.totalSize)}</Text>
                <Text style={styles.statLabel}>Total Size</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.recentUploads}</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
            </View>
          )}

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'browse' && styles.activeTab]}
              onPress={() => setActiveTab('browse')}
            >
              <Text style={[styles.tabText, activeTab === 'browse' && styles.activeTabText]}>
                Browse
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
                <ActivityIndicator size="large" color="#30cfd0" />
              </View>
            )}

            {activeTab === 'browse' && (
              <View>
                <View style={styles.controls}>
                  <View style={styles.categoryFilter}>
                    <Text style={styles.filterLabel}>Category:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <TouchableOpacity
                        style={[styles.categoryButton, selectedCategory === 'all' && styles.activeCategoryButton]}
                        onPress={() => setSelectedCategory('all')}
                      >
                        <Text style={[styles.categoryButtonText, selectedCategory === 'all' && styles.activeCategoryButtonText]}>
                          All
                        </Text>
                      </TouchableOpacity>
                      {categories.map((category) => (
                        <TouchableOpacity
                          key={category}
                          style={[styles.categoryButton, selectedCategory === category && styles.activeCategoryButton]}
                          onPress={() => setSelectedCategory(category)}
                        >
                          <Text style={[styles.categoryButtonText, selectedCategory === category && styles.activeCategoryButtonText]}>
                            {category}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => setUploadModalVisible(true)}
                  >
                    <MaterialCommunityIcons name="upload" size={20} color="#fff" />
                    <Text style={styles.uploadButtonText}>Upload</Text>
                  </TouchableOpacity>
                </View>

                {documents.map((doc) => (
                  <View key={doc.id} style={styles.documentItem}>
                    <View style={styles.documentInfo}>
                      <View style={styles.documentHeader}>
                        <MaterialCommunityIcons name="file-document" size={24} color="#30cfd0" />
                        <View style={styles.documentDetails}>
                          <Text style={styles.documentTitle}>{doc.title}</Text>
                          <Text style={styles.documentMeta}>
                            {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                          </Text>
                          {doc.description && (
                            <Text style={styles.documentDescription}>{doc.description}</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.documentActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDownload(doc)}
                        >
                          <MaterialCommunityIcons name="download" size={20} color="#4CAF50" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteDocument(doc)}
                        >
                          <MaterialCommunityIcons name="delete" size={20} color="#F44336" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}

                {documents.length === 0 && !loading && (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="folder-open" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>No documents found</Text>
                    <Text style={styles.emptyStateSubtext}>Upload your first document to get started</Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'search' && (
              <View>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                  />
                  <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                {searchResults.length > 0 && (
                  <View>
                    <Text style={styles.sectionTitle}>Search Results ({searchResults.length})</Text>
                    {searchResults.map((doc) => (
                      <View key={doc.id} style={styles.documentItem}>
                        <View style={styles.documentInfo}>
                          <View style={styles.documentHeader}>
                            <MaterialCommunityIcons name="file-document" size={24} color="#30cfd0" />
                            <View style={styles.documentDetails}>
                              <Text style={styles.documentTitle}>{doc.title}</Text>
                              <Text style={styles.documentMeta}>
                                {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                              </Text>
                              {doc.description && (
                                <Text style={styles.documentDescription}>{doc.description}</Text>
                              )}
                            </View>
                          </View>
                          <View style={styles.documentActions}>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleDownload(doc)}
                            >
                              <MaterialCommunityIcons name="download" size={20} color="#4CAF50" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Upload Modal */}
          <Modal
            visible={uploadModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setUploadModalVisible(false)}
          >
            <View style={styles.uploadModalOverlay}>
              <View style={styles.uploadModalContent}>
                <Text style={styles.uploadModalTitle}>Upload Document</Text>
                
                <TouchableOpacity style={styles.filePickerButton} onPress={pickDocument}>
                  <MaterialCommunityIcons name="file-plus" size={24} color="#30cfd0" />
                  <Text style={styles.filePickerText}>
                    {selectedFile ? selectedFile.name : 'Select File'}
                  </Text>
                </TouchableOpacity>
                
                <TextInput
                  style={styles.uploadInput}
                  placeholder="Document title *"
                  value={uploadData.title}
                  onChangeText={(text) => setUploadData(prev => ({...prev, title: text}))}
                />
                
                <TextInput
                  style={[styles.uploadInput, styles.uploadTextArea]}
                  placeholder="Description (optional)"
                  value={uploadData.description}
                  onChangeText={(text) => setUploadData(prev => ({...prev, description: text}))}
                  multiline
                  numberOfLines={3}
                />
                
                <TextInput
                  style={styles.uploadInput}
                  placeholder="Category"
                  value={uploadData.category}
                  onChangeText={(text) => setUploadData(prev => ({...prev, category: text}))}
                />
                
                <TextInput
                  style={styles.uploadInput}
                  placeholder="Tags (comma separated)"
                  value={uploadData.tags}
                  onChangeText={(text) => setUploadData(prev => ({...prev, tags: text}))}
                />
                
                <View style={styles.uploadModalButtons}>
                  <TouchableOpacity
                    style={[styles.uploadModalButton, styles.cancelButton]}
                    onPress={() => {
                      setUploadModalVisible(false);
                      resetUploadForm();
                    }}
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
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#30cfd0',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
    borderBottomColor: '#30cfd0',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#30cfd0',
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
  controls: {
    marginBottom: 20,
  },
  categoryFilter: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeCategoryButton: {
    backgroundColor: '#30cfd0',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#666',
  },
  activeCategoryButtonText: {
    color: '#fff',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#30cfd0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  documentItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  documentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  documentHeader: {
    flexDirection: 'row',
    flex: 1,
  },
  documentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  documentMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  documentDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  documentActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
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
    backgroundColor: '#30cfd0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  emptyStateSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#999',
  },
  
  // Upload Modal Styles
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
    textAlign: 'center',
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#30cfd0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    justifyContent: 'center',
  },
  filePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#30cfd0',
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
  uploadTextArea: {
    height: 80,
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
    backgroundColor: '#30cfd0',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default LocalFileManager;