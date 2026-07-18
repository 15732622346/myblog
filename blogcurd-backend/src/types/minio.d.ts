declare module 'minio' {
  export interface ClientOptions {
    endPoint: string;
    port?: number;
    useSSL?: boolean;
    accessKey?: string;
    secretKey?: string;
    region?: string;
    transport?: any;
    sessionToken?: string;
    partSize?: number;
    pathStyle?: boolean;
  }

  export class Client {
    constructor(options: ClientOptions);
    
    // 常用方法
    makeBucket(bucketName: string, region?: string): Promise<void>;
    bucketExists(bucketName: string): Promise<boolean>;
    putObject(bucketName: string, objectName: string, stream: any, size?: number, metaData?: any): Promise<any>;
    getObject(bucketName: string, objectName: string): Promise<any>;
    removeObject(bucketName: string, objectName: string): Promise<void>;
    statObject(bucketName: string, objectName: string): Promise<any>;
    listBuckets(): Promise<any[]>;
    listObjects(bucketName: string, prefix?: string, recursive?: boolean): any;
    setBucketPolicy(bucketName: string, policy: string): Promise<void>;
  }
}
