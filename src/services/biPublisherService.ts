import axios, { AxiosInstance } from 'axios';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { Connection, SOAPResponse } from '../types';

export class BIPublisherService {
  private axiosInstance: AxiosInstance;
  private parser: XMLParser;
  private builder: XMLBuilder;
  private connection: Connection;
  private sessionId: string | null = null;

  constructor(connection: Connection) {
    this.connection = connection;
    this.sessionId = connection.sessionId || null;

    this.axiosInstance = axios.create({
      baseURL: connection.url,
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        SOAPAction: '',
      },
      auth: connection.useSSO
        ? undefined
        : {
            username: connection.username,
            password: connection.password,
          },
    });

    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });

    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      format: true,
    });
  }

  /**
   * Login to BI Publisher and get session ID
   */
  async login(): Promise<SOAPResponse> {
    try {
      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:v2="http://xmlns.oracle.com/oxp/service/v2">
  <soapenv:Header/>
  <soapenv:Body>
    <v2:login>
      <v2:userID>${this.connection.username}</v2:userID>
      <v2:password>${this.connection.password}</v2:password>
    </v2:login>
  </soapenv:Body>
</soapenv:Envelope>`;

      // Log the request details
      const loginUrl = `${this.connection.url}:443/xmlpserver/services/v2/SecurityService`;
      console.log('=== SecurityService Login Request ===');
      console.log('URL:', loginUrl);
      console.log('Username:', this.connection.username);
      console.log('Payload:', soapEnvelope);
      console.log('=====================================');

      // Make request via Electron main process to bypass CORS
      const response = await window.electronAPI.soapRequest({
        url: loginUrl,
        data: soapEnvelope,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          SOAPAction: '',
        },
        auth: this.connection.useSSO
          ? undefined
          : {
              username: this.connection.username,
              password: this.connection.password,
            },
      });

      if (!response.success) {
        throw new Error(response.error || 'SOAP request failed');
      }

      // Log the response
      console.log('=== SecurityService Login Response ===');
      console.log('Status:', response.status);
      console.log('Response Data:', response.data);
      console.log('======================================');

      const result = this.parser.parse(response.data);
      console.log('Parsed Result:', JSON.stringify(result, null, 2));

      // Extract session ID from response
      const loginReturn = result?.['soapenv:Envelope']?.['soapenv:Body']?.loginResponse?.loginReturn;

      if (loginReturn) {
        this.sessionId = loginReturn;
        this.connection.sessionId = loginReturn;
        console.log('Session ID obtained:', loginReturn);
        return { success: true, data: { sessionId: loginReturn } };
      } else {
        console.error('Failed to extract session ID from response');
        return { success: false, error: 'Failed to get session ID from login response' };
      }
    } catch (error: any) {
      console.error('=== SecurityService Login Error ===');
      console.error('Error:', error);
      console.error('Error Message:', error.message);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);
      console.error('===================================');
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Create a folder in the BI Catalog
   */
  async createFolder(folderPath: string): Promise<SOAPResponse> {
    try {
      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:v2="http://xmlns.oracle.com/oxp/service/v2">
  <soapenv:Header/>
  <soapenv:Body>
    <v2:createFolder>
      <v2:folderAbsolutePath>${folderPath}</v2:folderAbsolutePath>
    </v2:createFolder>
  </soapenv:Body>
</soapenv:Envelope>`;

      const catalogUrl = `${this.connection.url}:443/xmlpserver/services/v2/CatalogService`;
      console.log('=== Create Folder Request ===');
      console.log('URL:', catalogUrl);
      console.log('Folder Path:', folderPath);

      // Make request via Electron main process to bypass CORS
      const response = await window.electronAPI.soapRequest({
        url: catalogUrl,
        data: soapEnvelope,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          SOAPAction: '',
        },
        auth: this.connection.useSSO
          ? undefined
          : {
              username: this.connection.username,
              password: this.connection.password,
            },
      });

      if (!response.success) {
        throw new Error(response.error || 'SOAP request failed');
      }

      console.log('=== Create Folder Response ===');
      console.log('Status:', response.status);

      const result = this.parser.parse(response.data);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Error creating folder:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get catalog items (folders, reports, data models)
   */
  async getCatalogItems(folderPath: string = '/'): Promise<SOAPResponse> {
    try {
      // Ensure we have a session ID
      if (!this.sessionId) {
        console.log('No session ID found, logging in first...');
        const loginResult = await this.login();
        if (!loginResult.success) {
          return loginResult;
        }
      }

      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:v2="http://xmlns.oracle.com/oxp/service/v2">
  <soapenv:Header/>
  <soapenv:Body>
    <v2:getFolderContentsInSession>
      <v2:folderAbsolutePath>${folderPath || '/'}</v2:folderAbsolutePath>
      <v2:bipSessionToken>${this.sessionId}</v2:bipSessionToken>
    </v2:getFolderContentsInSession>
  </soapenv:Body>
</soapenv:Envelope>`;

      const catalogUrl = `${this.connection.url}:443/xmlpserver/services/v2/CatalogService`;
      console.log('=== Get Folder Contents Request ===');
      console.log('URL:', catalogUrl);
      console.log('Folder Path:', folderPath || '/');
      console.log('Session Token:', this.sessionId);
      console.log('Payload:', soapEnvelope);

      // Make request via Electron main process to bypass CORS
      const response = await window.electronAPI.soapRequest({
        url: catalogUrl,
        data: soapEnvelope,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          SOAPAction: '',
        },
        // No auth needed - using session token instead
      });

      if (!response.success) {
        throw new Error(response.error || 'SOAP request failed');
      }

      console.log('=== Get Folder Contents Response ===');
      console.log('Status:', response.status);
      console.log('Response Data:', response.data);

      const result = this.parser.parse(response.data);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Error getting catalog items:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute a report with SQL query
   */
  async executeQuery(dataModelPath: string, sqlQuery: string): Promise<SOAPResponse> {
    try {
      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:pub="http://xmlns.oracle.com/oxp/service/PublicReportService">
  <soapenv:Header/>
  <soapenv:Body>
    <pub:runReport>
      <pub:reportRequest>
        <pub:attributeFormat>xml</pub:attributeFormat>
        <pub:attributeTemplate/>
        <pub:reportAbsolutePath>${dataModelPath}</pub:reportAbsolutePath>
        <pub:sizeOfDataChunkDownload>-1</pub:sizeOfDataChunkDownload>
      </pub:reportRequest>
      <pub:userID>${this.connection.username}</pub:userID>
      <pub:password>${this.connection.password}</pub:password>
    </pub:runReport>
  </soapenv:Body>
</soapenv:Envelope>`;

      const reportUrl = `${this.connection.url}:443/xmlpserver/services/ExternalReportWSSService`;
      console.log('=== Execute Query Request ===');
      console.log('URL:', reportUrl);
      console.log('Data Model Path:', dataModelPath);

      // Make request via Electron main process to bypass CORS
      const response = await window.electronAPI.soapRequest({
        url: reportUrl,
        data: soapEnvelope,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          SOAPAction: '',
        },
        auth: this.connection.useSSO
          ? undefined
          : {
              username: this.connection.username,
              password: this.connection.password,
            },
      });

      if (!response.success) {
        throw new Error(response.error || 'SOAP request failed');
      }

      console.log('=== Execute Query Response ===');
      console.log('Status:', response.status);

      const result = this.parser.parse(response.data);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Error executing query:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<SOAPResponse> {
    try {
      // First login to get session ID
      const loginResult = await this.login();

      if (!loginResult.success) {
        return loginResult;
      }

      // Then try to get root catalog items as a connection test
      const result = await this.getCatalogItems('/');
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get data models from catalog
   */
  async getDataModels(folderPath: string = '/'): Promise<SOAPResponse> {
    try {
      const items = await this.getCatalogItems(folderPath);

      if (!items.success) {
        return items;
      }

      // Parse and filter data models
      // This is a simplified version - actual parsing depends on the XML structure
      const dataModels: any[] = [];

      return { success: true, data: dataModels };
    } catch (error: any) {
      console.error('Error getting data models:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create default data model (for Version 2)
   */
  async createDefaultDataModel(folderPath: string): Promise<SOAPResponse> {
    // This will be implemented in Version 2
    return { success: false, error: 'Not implemented in Version 1' };
  }

  /**
   * Create default report (for Version 2)
   */
  async createDefaultReport(folderPath: string): Promise<SOAPResponse> {
    // This will be implemented in Version 2
    return { success: false, error: 'Not implemented in Version 1' };
  }
}

// Helper function to create service instance
export const createBIPublisherService = (connection: Connection): BIPublisherService => {
  return new BIPublisherService(connection);
};
