import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plant } from '../types/garden';
import { ActivityEntry } from '../types/activity';
import { NotiItem } from '../types/notifications';

export interface ExportData {
  exportDate: string;
  appVersion: string;
  plants: Plant[];
  activities: ActivityEntry[];
  notifications: NotiItem[];
  analytics?: any;
  preferences?: any;
}

export interface ExportOptions {
  includeImages: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  plantIds?: string[];
  format: 'csv' | 'json' | 'pdf';
  sections: {
    plants: boolean;
    activities: boolean;
    notifications: boolean;
    analytics: boolean;
  };
}

class ExportService {
  private static instance: ExportService;

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  // Export data in various formats
  async exportData(
    plants: Plant[],
    activities: ActivityEntry[],
    notifications: NotiItem[],
    options: ExportOptions
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // Filter data based on options
      const filteredData = this.filterDataByOptions(
        { plants, activities, notifications },
        options
      );

      let fileContent: string;
      let fileName: string;
      let mimeType: string;

      switch (options.format) {
        case 'csv':
          fileContent = await this.generateCSV(filteredData, options);
          fileName = `smart-plant-export-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        case 'json':
          fileContent = await this.generateJSON(filteredData, options);
          fileName = `smart-plant-export-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        case 'pdf':
          fileContent = await this.generatePDF(filteredData, options);
          fileName = `smart-plant-export-${new Date().toISOString().split('T')[0]}.pdf`;
          mimeType = 'application/pdf';
          break;
        default:
          throw new Error('Unsupported export format');
      }

      // Write file to device
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, fileContent, {
        encoding: options.format === 'pdf' ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8,
      });

      return { success: true, filePath };
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Share exported file
  async shareExportedFile(filePath: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      await Sharing.shareAsync(filePath, {
        mimeType: this.getMimeTypeFromPath(filePath),
        dialogTitle: 'แชร์ข้อมูลต้นไม้',
      });

      return true;
    } catch (error) {
      console.error('Sharing failed:', error);
      return false;
    }
  }

  // Import data from file
  async importData(): Promise<{ success: boolean; data?: ExportData; error?: string }> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return { success: false, error: 'Import cancelled' };
      }

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const importedData: ExportData = JSON.parse(fileContent);

      // Validate imported data structure
      if (!this.validateImportData(importedData)) {
        return { success: false, error: 'Invalid data format' };
      }

      return { success: true, data: importedData };
    } catch (error) {
      console.error('Import failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Import failed' };
    }
  }

  // Backup all app data
  async createFullBackup(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // Collect all data from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith('@spa/'));
      const allData = await AsyncStorage.multiGet(appKeys);

      const backupData = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
        backupType: 'full',
        data: Object.fromEntries(
          allData.map(([key, value]) => [key, value ? JSON.parse(value) : null])
        ),
      };

      const fileName = `smart-plant-backup-${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(backupData, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      return { success: true, filePath };
    } catch (error) {
      console.error('Backup failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Backup failed' };
    }
  }

  // Restore from backup
  async restoreFromBackup(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return { success: false, error: 'Restore cancelled' };
      }

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const backupData = JSON.parse(fileContent);

      if (!backupData.data || typeof backupData.data !== 'object') {
        return { success: false, error: 'Invalid backup format' };
      }

      // Restore data to AsyncStorage
      const entries = Object.entries(backupData.data).map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);

      await AsyncStorage.multiSet(entries as [string, string][]);

      return { success: true };
    } catch (error) {
      console.error('Restore failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Restore failed' };
    }
  }

  // Generate CSV format
  private async generateCSV(
    data: { plants: Plant[]; activities: ActivityEntry[]; notifications: NotiItem[] },
    options: ExportOptions
  ): Promise<string> {
    let csv = '';

    // Plants section
    if (options.sections.plants && data.plants.length > 0) {
      csv += 'Plants\n';
      csv += 'ID,Name,Scientific Name,Status,Created Date\n';

      data.plants.forEach(plant => {
        const row = [
          plant.id,
          plant.name,
          plant.scientificName || '',
          plant.status,
          new Date().toISOString().split('T')[0], // Mock created date
        ].map(field => `"${field}"`).join(',');
        csv += row + '\n';
      });
      csv += '\n';
    }

    // Activities section
    if (options.sections.activities && data.activities.length > 0) {
      csv += 'Activities\n';
      csv += 'ID,Plant ID,Activity Type,Quantity,Unit,NPK N,NPK P,NPK K,Date,Time,Notes\n';

      data.activities.forEach(activity => {
        const row = [
          activity.id,
          activity.plantId,
          activity.kind,
          activity.quantity || '',
          activity.unit || '',
          activity.npk?.n || '',
          activity.npk?.p || '',
          activity.npk?.k || '',
          activity.dateISO,
          activity.time24 || '',
          activity.note || '',
        ].map(field => `"${field}"`).join(',');
        csv += row + '\n';
      });
      csv += '\n';
    }

    // Notifications section
    if (options.sections.notifications && data.notifications.length > 0) {
      csv += 'Notifications\n';
      csv += 'ID,Type,Title,Detail,Time Label,Read,Created Date\n';

      data.notifications.forEach(notification => {
        const row = [
          notification.id,
          notification.type,
          notification.title,
          notification.detail || '',
          notification.timeLabel,
          notification.read ? 'Yes' : 'No',
          notification.createdAt ? new Date(notification.createdAt).toISOString().split('T')[0] : '',
        ].map(field => `"${field}"`).join(',');
        csv += row + '\n';
      });
    }

    return csv;
  }

  // Generate JSON format
  private async generateJSON(
    data: { plants: Plant[]; activities: ActivityEntry[]; notifications: NotiItem[] },
    options: ExportOptions
  ): Promise<string> {
    const exportData: ExportData = {
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0',
      plants: options.sections.plants ? data.plants : [],
      activities: options.sections.activities ? data.activities : [],
      notifications: options.sections.notifications ? data.notifications : [],
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Generate PDF format (simplified HTML to PDF)
  private async generatePDF(
    data: { plants: Plant[]; activities: ActivityEntry[]; notifications: NotiItem[] },
    options: ExportOptions
  ): Promise<string> {
    // For now, return a simple HTML report as base64
    // In production, you might want to use react-native-html-to-pdf
    const htmlContent = this.generateHTMLReport(data, options);

    // Convert HTML to base64 (mock implementation)
    // In reality, you'd use a proper PDF generation library
    return Buffer.from(htmlContent).toString('base64');
  }

  // Generate HTML report
  private generateHTMLReport(
    data: { plants: Plant[]; activities: ActivityEntry[]; notifications: NotiItem[] },
    options: ExportOptions
  ): string {
    const today = new Date().toLocaleDateString('th-TH');

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Smart Plant AI - รายงานข้อมูล</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #16a34a; text-align: center; }
          h2 { color: #374151; border-bottom: 2px solid #e5e7eb; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .summary { background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>🌱 Smart Plant AI - รายงานข้อมูล</h1>
        <p><strong>วันที่ออกรายงาน:</strong> ${today}</p>

        <div class="summary">
          <h3>สรุปข้อมูล</h3>
          <p><strong>จำนวนต้นไม้:</strong> ${data.plants.length} ต้น</p>
          <p><strong>จำนวนกิจกรรม:</strong> ${data.activities.length} รายการ</p>
          <p><strong>การแจ้งเตือน:</strong> ${data.notifications.length} รายการ</p>
        </div>
    `;

    // Plants section
    if (options.sections.plants && data.plants.length > 0) {
      html += `
        <h2>ข้อมูลต้นไม้</h2>
        <table>
          <tr>
            <th>ชื่อต้นไม้</th>
            <th>ชื่อวิทยาศาสตร์</th>
            <th>สถานะสุขภาพ</th>
          </tr>
      `;

      data.plants.forEach(plant => {
        html += `
          <tr>
            <td>${plant.name}</td>
            <td>${plant.scientificName || '-'}</td>
            <td>${plant.status}</td>
          </tr>
        `;
      });

      html += '</table>';
    }

    // Activities section
    if (options.sections.activities && data.activities.length > 0) {
      html += `
        <h2>ประวัติกิจกรรม</h2>
        <table>
          <tr>
            <th>วันที่</th>
            <th>กิจกรรม</th>
            <th>ปริมาณ</th>
            <th>หน่วย</th>
            <th>หมายเหตุ</th>
          </tr>
      `;

      data.activities.slice(0, 50).forEach(activity => { // Limit to last 50 activities
        html += `
          <tr>
            <td>${activity.dateISO}</td>
            <td>${activity.kind}</td>
            <td>${activity.quantity || '-'}</td>
            <td>${activity.unit || '-'}</td>
            <td>${activity.note || '-'}</td>
          </tr>
        `;
      });

      html += '</table>';
    }

    html += `
        <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>สร้างโดย Smart Plant AI - แอปพลิเคชันดูแลต้นไม้อัจฉริยะ</p>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  // Filter data based on export options
  private filterDataByOptions(
    data: { plants: Plant[]; activities: ActivityEntry[]; notifications: NotiItem[] },
    options: ExportOptions
  ): { plants: Plant[]; activities: ActivityEntry[]; notifications: NotiItem[] } {
    let { plants, activities, notifications } = data;

    // Filter by plant IDs
    if (options.plantIds && options.plantIds.length > 0) {
      plants = plants.filter(plant => options.plantIds!.includes(plant.id));
      activities = activities.filter(activity => options.plantIds!.includes(activity.plantId));
    }

    // Filter by date range
    if (options.dateRange) {
      const { startDate, endDate } = options.dateRange;
      activities = activities.filter(activity =>
        activity.dateISO >= startDate && activity.dateISO <= endDate
      );
      notifications = notifications.filter(notification =>
        notification.createdAt &&
        new Date(notification.createdAt).toISOString().split('T')[0] >= startDate &&
        new Date(notification.createdAt).toISOString().split('T')[0] <= endDate
      );
    }

    return { plants, activities, notifications };
  }

  // Validate imported data structure
  private validateImportData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      data.exportDate &&
      Array.isArray(data.plants) &&
      Array.isArray(data.activities) &&
      Array.isArray(data.notifications)
    );
  }

  // Get MIME type from file path
  private getMimeTypeFromPath(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }

  // Get exported files
  async getExportedFiles(): Promise<{ name: string; path: string; size: number; date: Date }[]> {
    try {
      const directory = FileSystem.documentDirectory;
      if (!directory) return [];

      const files = await FileSystem.readDirectoryAsync(directory);
      const exportFiles = files.filter(file =>
        file.includes('smart-plant-') && (file.endsWith('.csv') || file.endsWith('.json') || file.endsWith('.pdf'))
      );

      const fileInfos = await Promise.all(
        exportFiles.map(async (file) => {
          const filePath = `${directory}${file}`;
          const info = await FileSystem.getInfoAsync(filePath);
          return {
            name: file,
            path: filePath,
            size: info.size || 0,
            date: new Date(info.modificationTime || 0),
          };
        })
      );

      return fileInfos.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Failed to get exported files:', error);
      return [];
    }
  }

  // Delete exported file
  async deleteExportedFile(filePath: string): Promise<boolean> {
    try {
      await FileSystem.deleteAsync(filePath);
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }
}

export const exportService = ExportService.getInstance();