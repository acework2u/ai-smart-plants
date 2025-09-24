import { Request, Response, NextFunction } from 'express';
import logger from '@utils/logger';

export interface ApiVersion {
  version: string;
  deprecated?: boolean;
  deprecationDate?: string;
  sunsetDate?: string;
  supportedUntil?: string;
  features: string[];
  breaking_changes?: string[];
}

export interface VersionConfig {
  default: string;
  supported: string[];
  deprecated: string[];
  sunset: string[];
  mapping: Record<string, ApiVersion>;
}

// API version configuration
const versionConfig: VersionConfig = {
  default: 'v1',
  supported: ['v1', 'v2'],
  deprecated: ['v0'],
  sunset: [],
  mapping: {
    'v0': {
      version: 'v0',
      deprecated: true,
      deprecationDate: '2024-01-01',
      sunsetDate: '2024-06-01',
      supportedUntil: '2024-06-01',
      features: ['basic_auth', 'plant_identification'],
      breaking_changes: ['auth_token_format_changed', 'error_response_structure_updated'],
    },
    'v1': {
      version: 'v1',
      features: [
        'oauth_authentication',
        'plant_identification',
        'plant_care_recommendations',
        'user_gardens',
        'weather_integration',
        'social_features',
        'rate_limiting',
        'caching',
      ],
    },
    'v2': {
      version: 'v2',
      features: [
        'oauth_authentication',
        'plant_identification',
        'plant_care_recommendations',
        'user_gardens',
        'weather_integration',
        'social_features',
        'rate_limiting',
        'caching',
        'ai_recommendations',
        'plant_health_monitoring',
        'subscription_management',
        'advanced_analytics',
      ],
    },
  },
};

// Extract version from request
const extractVersion = (req: Request): string => {
  // Priority order:
  // 1. URL parameter (/api/v1/...)
  // 2. Accept header (Accept: application/vnd.smartplant.v1+json)
  // 3. X-API-Version header
  // 4. Query parameter (?version=v1)
  // 5. Default version

  // 1. URL parameter
  const urlVersion = req.params.version;
  if (urlVersion && isValidVersion(urlVersion)) {
    return urlVersion;
  }

  // 2. Accept header
  const acceptHeader = req.get('Accept');
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/application\/vnd\.smartplant\.([^+]+)\+json/);
    if (versionMatch && isValidVersion(versionMatch[1])) {
      return versionMatch[1];
    }
  }

  // 3. X-API-Version header
  const versionHeader = req.get('X-API-Version');
  if (versionHeader && isValidVersion(versionHeader)) {
    return versionHeader;
  }

  // 4. Query parameter
  const queryVersion = req.query.version as string;
  if (queryVersion && isValidVersion(queryVersion)) {
    return queryVersion;
  }

  // 5. Default
  return versionConfig.default;
};

// Validate version
const isValidVersion = (version: string): boolean => {
  return Object.keys(versionConfig.mapping).includes(version);
};

// Check if version is supported
const isVersionSupported = (version: string): boolean => {
  return versionConfig.supported.includes(version);
};

// Check if version is deprecated
const isVersionDeprecated = (version: string): boolean => {
  return versionConfig.deprecated.includes(version);
};

// Check if version is sunset
const isVersionSunset = (version: string): boolean => {
  return versionConfig.sunset.includes(version);
};

// Main version middleware
export const versionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestedVersion = extractVersion(req);

    // Validate version
    if (!isValidVersion(requestedVersion)) {
      return res.status(400).json({
        data: null,
        meta: {
          traceId: req.headers['x-trace-id'] ?? null,
          degraded: false,
          api_version: requestedVersion,
        },
        errors: [
          {
            code: 'version/invalid',
            message: `Unsupported API version: ${requestedVersion}`,
            details: {
              requested_version: requestedVersion,
              supported_versions: versionConfig.supported,
              default_version: versionConfig.default,
            },
          },
        ],
      });
    }

    // Check if version is sunset
    if (isVersionSunset(requestedVersion)) {
      return res.status(410).json({
        data: null,
        meta: {
          traceId: req.headers['x-trace-id'] ?? null,
          degraded: false,
          api_version: requestedVersion,
        },
        errors: [
          {
            code: 'version/sunset',
            message: `API version ${requestedVersion} has been sunset and is no longer available`,
            details: {
              requested_version: requestedVersion,
              sunset_date: versionConfig.mapping[requestedVersion]?.sunsetDate,
              current_versions: versionConfig.supported,
            },
          },
        ],
      });
    }

    // Store version info in request
    req.apiVersion = requestedVersion;
    req.versionInfo = versionConfig.mapping[requestedVersion];

    // Set response headers
    res.set({
      'X-API-Version': requestedVersion,
      'X-API-Versions-Supported': versionConfig.supported.join(', '),
    });

    // Add deprecation warning if needed
    if (isVersionDeprecated(requestedVersion)) {
      const versionInfo = versionConfig.mapping[requestedVersion];
      res.set({
        'Deprecation': versionInfo.deprecationDate || 'true',
        'Sunset': versionInfo.sunsetDate || '',
        'Warning': `299 - "API version ${requestedVersion} is deprecated. Please upgrade to a supported version."`,
      });

      logger.warn(`Deprecated API version used: ${requestedVersion}`, {
        version: requestedVersion,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        endpoint: req.originalUrl,
      });
    }

    // Log version usage
    logger.debug(`API version used: ${requestedVersion}`, {
      version: requestedVersion,
      endpoint: req.originalUrl,
      method: req.method,
    });

    next();
  } catch (error) {
    logger.error('Version middleware error:', error);
    next(error);
  }
};

// Feature flag middleware
export const requireFeature = (featureName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = req.apiVersion || versionConfig.default;
    const versionInfo = versionConfig.mapping[version];

    if (!versionInfo || !versionInfo.features.includes(featureName)) {
      return res.status(404).json({
        data: null,
        meta: {
          traceId: req.headers['x-trace-id'] ?? null,
          degraded: false,
          api_version: version,
        },
        errors: [
          {
            code: 'feature/not-available',
            message: `Feature '${featureName}' is not available in API version ${version}`,
            details: {
              feature: featureName,
              version: version,
              available_features: versionInfo?.features || [],
              upgrade_to: versionConfig.supported.filter(v =>
                versionConfig.mapping[v]?.features.includes(featureName)
              )[0],
            },
          },
        ],
      });
    }

    next();
  };
};

// Version-specific route handler
export const versionedRoute = (handlers: Record<string, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = req.apiVersion || versionConfig.default;
    const handler = handlers[version] || handlers.default;

    if (!handler) {
      return res.status(501).json({
        data: null,
        meta: {
          traceId: req.headers['x-trace-id'] ?? null,
          degraded: false,
          api_version: version,
        },
        errors: [
          {
            code: 'version/not-implemented',
            message: `Endpoint not implemented for API version ${version}`,
            details: {
              version: version,
              available_versions: Object.keys(handlers),
            },
          },
        ],
      });
    }

    handler(req, res, next);
  };
};

// Response transformer middleware
export const transformResponse = (req: Request, res: Response, next: NextFunction) => {
  const version = req.apiVersion || versionConfig.default;
  const originalJson = res.json.bind(res);

  res.json = function(data: any) {
    const transformedData = applyVersionTransforms(data, version);
    return originalJson(transformedData);
  };

  next();
};

// Apply version-specific transformations
const applyVersionTransforms = (data: any, version: string): any => {
  switch (version) {
    case 'v0':
      // Legacy format transformations
      return transformToV0Format(data);

    case 'v1':
      // V1 format (current standard)
      return data;

    case 'v2':
      // V2 format with additional fields
      return transformToV2Format(data);

    default:
      return data;
  }
};

// Transform to v0 legacy format
const transformToV0Format = (data: any): any => {
  if (!data) return data;

  // Legacy v0 format doesn't have meta object
  if (data.data !== undefined && data.meta !== undefined) {
    return {
      result: data.data,
      success: !data.errors || data.errors.length === 0,
      errors: data.errors || [],
    };
  }

  return data;
};

// Transform to v2 format with enhancements
const transformToV2Format = (data: any): any => {
  if (!data) return data;

  // Add v2 specific fields
  if (data.meta) {
    data.meta.api_version = 'v2';
    data.meta.response_time = Date.now() - (data.meta.start_time || Date.now());
    data.meta.enhanced = true;
  }

  return data;
};

// Version comparison utilities
export const isVersionAtLeast = (currentVersion: string, requiredVersion: string): boolean => {
  const current = parseInt(currentVersion.replace('v', ''));
  const required = parseInt(requiredVersion.replace('v', ''));
  return current >= required;
};

export const isVersionBelow = (currentVersion: string, targetVersion: string): boolean => {
  return !isVersionAtLeast(currentVersion, targetVersion);
};

// API version info endpoint
export const getVersionInfo = (req: Request, res: Response) => {
  const requestedVersion = req.params.version || req.apiVersion || versionConfig.default;

  if (!isValidVersion(requestedVersion)) {
    return res.status(404).json({
      data: null,
      meta: {
        traceId: req.headers['x-trace-id'] ?? null,
        degraded: false,
      },
      errors: [
        {
          code: 'version/not-found',
          message: `API version ${requestedVersion} not found`,
        },
      ],
    });
  }

  const versionInfo = versionConfig.mapping[requestedVersion];

  res.json({
    data: {
      version: versionInfo.version,
      status: isVersionSunset(requestedVersion) ? 'sunset' :
              isVersionDeprecated(requestedVersion) ? 'deprecated' :
              isVersionSupported(requestedVersion) ? 'supported' : 'unknown',
      deprecated: versionInfo.deprecated || false,
      deprecation_date: versionInfo.deprecationDate,
      sunset_date: versionInfo.sunsetDate,
      supported_until: versionInfo.supportedUntil,
      features: versionInfo.features,
      breaking_changes: versionInfo.breaking_changes || [],
    },
    meta: {
      traceId: req.headers['x-trace-id'] ?? null,
      degraded: false,
      api_version: requestedVersion,
    },
    errors: [],
  });
};

// Get all versions info
export const getAllVersionsInfo = (req: Request, res: Response) => {
  const allVersions = Object.keys(versionConfig.mapping).map(version => {
    const info = versionConfig.mapping[version];
    return {
      version: info.version,
      status: isVersionSunset(version) ? 'sunset' :
              isVersionDeprecated(version) ? 'deprecated' :
              isVersionSupported(version) ? 'supported' : 'unknown',
      deprecated: info.deprecated || false,
      deprecation_date: info.deprecationDate,
      sunset_date: info.sunsetDate,
      supported_until: info.supportedUntil,
      features: info.features,
      breaking_changes: info.breaking_changes || [],
    };
  });

  res.json({
    data: {
      default_version: versionConfig.default,
      supported_versions: versionConfig.supported,
      deprecated_versions: versionConfig.deprecated,
      sunset_versions: versionConfig.sunset,
      versions: allVersions,
    },
    meta: {
      traceId: req.headers['x-trace-id'] ?? null,
      degraded: false,
    },
    errors: [],
  });
};

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
      versionInfo?: ApiVersion;
    }
  }
}

export { versionConfig };
