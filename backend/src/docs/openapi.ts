export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Smart Plant AI API',
    version: '0.2.0',
    description:
      'Smart Plant AI backend services for mobile clients. Authentication uses OAuth 2.1 Bearer tokens (JWT).'
  },
  servers: [{ url: 'http://localhost:4000/v1' }],
  security: [{ BearerAuth: [] }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide a valid OAuth 2.1 access token. In development you may use X-User-Id instead.'
      }
    },
    parameters: {
      TraceIdHeader: {
        name: 'X-Trace-Id',
        in: 'header',
        required: false,
        schema: { type: 'string', format: 'uuid' }
      }
    },
    schemas: {
      Envelope: {
        type: 'object',
        properties: {
          data: {},
          meta: {
            type: 'object',
            properties: {
              traceId: { type: 'string', nullable: true },
              degraded: { type: 'boolean' },
              api_version: { type: 'string', nullable: true }
            }
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                field: { type: 'string', nullable: true },
                hint: { type: 'string', nullable: true },
                meta: { type: 'object', nullable: true }
              }
            }
          }
        },
        required: ['data', 'meta', 'errors']
      },
      PlantPreference: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          plantId: { type: 'string' },
          lastKind: { type: 'string', nullable: true, enum: ['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ'] },
          lastUnit: { type: 'string', nullable: true, enum: ['ml', 'g', 'pcs', 'ล.'] },
          lastQty: { type: 'string', nullable: true },
          lastN: { type: 'string', nullable: true },
          lastP: { type: 'string', nullable: true },
          lastK: { type: 'string', nullable: true },
          reminderWater: { type: 'integer', nullable: true },
          reminderFertil: { type: 'integer', nullable: true },
          enableReminders: { type: 'boolean' }
        }
      },
      Plant: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          nickname: { type: 'string' },
          scientificName: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['healthy', 'warning', 'critical', 'archived'] },
          imageRef: { type: 'string', nullable: true },
          location: { type: 'object', nullable: true },
          statusColor: { type: 'string', nullable: true },
          preferences: { $ref: '#/components/schemas/PlantPreference' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Activity: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          plantId: { type: 'string' },
          userId: { type: 'string' },
          kind: { type: 'string', enum: ['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ'] },
          quantity: { type: 'string', nullable: true },
          unit: { type: 'string', nullable: true, enum: ['ml', 'g', 'pcs', 'ล.'] },
          npk: {
            type: 'object',
            nullable: true,
            properties: {
              n: { type: 'string', nullable: true },
              p: { type: 'string', nullable: true },
              k: { type: 'string', nullable: true }
            }
          },
          note: { type: 'string', nullable: true },
          dateISO: { type: 'string', format: 'date-time' },
          time24: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          plantId: { type: 'string', nullable: true },
          type: { type: 'string', enum: ['reminder', 'ai', 'alert', 'achievement', 'system'] },
          title: { type: 'string' },
          detail: { type: 'string', nullable: true },
          timeLabel: { type: 'string' },
          read: { type: 'boolean' },
          payload: { type: 'object', nullable: true },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      NotificationSubscription: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          deviceId: { type: 'string' },
          pushToken: { type: 'string' },
          platform: { type: 'string', enum: ['expo', 'apns', 'fcm'] },
          locale: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      InsightSummary: {
        type: 'object',
        properties: {
          totalPlants: { type: 'integer' },
          unreadNotifications: { type: 'integer' },
          recentActivities: { type: 'integer' },
          generatedAt: { type: 'string', format: 'date-time' }
        }
      },
      InsightTrend: {
        type: 'object',
        properties: {
          metric: { type: 'string' },
          window: { type: 'string' },
          averageInterval: { type: 'number', nullable: true },
          entries: { type: 'array', items: { type: 'object' }, nullable: true },
          averageScore: { type: 'number', nullable: true },
          samples: { type: 'integer', nullable: true },
          generatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Analysis: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          plantId: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['queued', 'processing', 'completed', 'failed', 'expired'] },
          imageRef: { type: 'string', nullable: true },
          plantName: { type: 'string', nullable: true },
          score: { type: 'number', nullable: true },
          issues: {
            type: 'array',
            nullable: true,
            items: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                severity: { type: 'string', nullable: true },
                confidence: { type: 'number', nullable: true }
              }
            }
          },
          recommendations: {
            type: 'array',
            nullable: true,
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                desc: { type: 'string' }
              }
            }
          },
          weatherSnapshot: { type: 'object', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      PlantListResponse: {
        allOf: [
          { $ref: '#/components/schemas/Envelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  nodes: { type: 'array', items: { $ref: '#/components/schemas/Plant' } },
                  pageInfo: {
                    type: 'object',
                    properties: {
                      hasNextPage: { type: 'boolean' },
                      nextCursor: { type: 'string', nullable: true }
                    }
                  }
                }
              }
            }
          }
        ]
      },
      ActivityListResponse: {
        allOf: [
          { $ref: '#/components/schemas/Envelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  nodes: { type: 'array', items: { $ref: '#/components/schemas/Activity' } },
                  pageInfo: {
                    type: 'object',
                    properties: {
                      hasNextPage: { type: 'boolean' },
                      nextCursor: { type: 'string', nullable: true }
                    }
                  }
                }
              }
            }
          }
        ]
      },
      AnalysisListResponse: {
        allOf: [
          { $ref: '#/components/schemas/Envelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  nodes: { type: 'array', items: { $ref: '#/components/schemas/Analysis' } },
                  pageInfo: {
                    type: 'object',
                    properties: {
                      hasNextPage: { type: 'boolean' },
                      nextCursor: { type: 'string', nullable: true }
                    }
                  }
                }
              }
            }
          }
        ]
      },
      NotificationListResponse: {
        allOf: [
          { $ref: '#/components/schemas/Envelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  nodes: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
                  pageInfo: {
                    type: 'object',
                    properties: {
                      hasNextPage: { type: 'boolean' },
                      nextCursor: { type: 'string', nullable: true }
                    }
                  }
                }
              }
            }
          }
        ]
      },
      InsightSummaryResponse: {
        allOf: [
          { $ref: '#/components/schemas/Envelope' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/InsightSummary' }
            }
          }
        ]
      },
      InsightTrendResponse: {
        allOf: [
          { $ref: '#/components/schemas/Envelope' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/InsightTrend' }
            }
          }
        ]
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time', nullable: true }
            }
          },
          accessToken: { type: 'string' },
          tokenType: { type: 'string' },
          expiresIn: { type: 'integer' }
        }
      },
      AuthResponseEnvelope: {
        allOf: [
          { $ref: '#/components/schemas/Envelope' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AuthResponse' }
            }
          }
        ]
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  role: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponseEnvelope' }
              }
            }
          },
          '409': { description: 'Email exists' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user and issue access token',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponseEnvelope' }
              }
            }
          },
          '401': { description: 'Invalid credentials' }
        }
      }
    },
    '/health': {
      get: {
        summary: 'Readiness probe',
        tags: ['System'],
        responses: {
          '200': {
            description: 'Service is healthy'
          }
        }
      }
    },
    '/versions': {
      get: {
        summary: 'List API versions',
        tags: ['System'],
        responses: {
          '200': {
            description: 'Version metadata'
          }
        }
      }
    },
    '/versions/{version}': {
      get: {
        summary: 'Get details of a specific version',
        tags: ['System'],
        parameters: [
          {
            name: 'version',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Version details' },
          '404': { description: 'Version not found' }
        }
      }
    },
    '/plants': {
      get: {
        summary: 'List plants for the authenticated user',
        tags: ['Plants'],
        parameters: [
          { $ref: '#/components/parameters/TraceIdHeader' },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['healthy', 'warning', 'critical', 'archived'] }
          },
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'updatedSince', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          { name: 'cursor', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'List of plants',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PlantListResponse' } }
            }
          }
        }
      },
      post: {
        summary: 'Create plant',
        tags: ['Plants'],
        parameters: [
          { $ref: '#/components/parameters/TraceIdHeader' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nickname'],
                properties: {
                  id: { type: 'string' },
                  nickname: { type: 'string' },
                  scientificName: { type: 'string' },
                  status: { type: 'string', enum: ['healthy', 'warning', 'critical', 'archived'] },
                  imageRef: { type: 'string' },
                  location: { type: 'object' },
                  statusColor: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Plant created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Envelope' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Plant' }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/plants/{plantId}': {
      parameters: [
        { $ref: '#/components/parameters/TraceIdHeader' },
        { name: 'plantId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      get: {
        summary: 'Get plant by id',
        tags: ['Plants'],
        responses: {
          '200': {
            description: 'Plant detail',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Envelope' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Plant' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '404': { description: 'Plant not found' }
        }
      },
      patch: {
        summary: 'Update plant metadata',
        tags: ['Plants'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Plant' } } }
        },
        responses: {
          '200': {
            description: 'Plant updated',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Envelope' },
                    {
                      type: 'object',
                      properties: { data: { $ref: '#/components/schemas/Plant' } }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Soft-delete plant',
        tags: ['Plants'],
        responses: {
          '204': { description: 'Deleted' }
        }
      }
    },
    '/plants/{plantId}/preferences': {
      put: {
        summary: 'Upsert plant preferences',
        tags: ['Plants'],
        parameters: [
          { $ref: '#/components/parameters/TraceIdHeader' },
          { name: 'plantId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  lastKind: { type: 'string' },
                  lastUnit: { type: 'string' },
                  lastQty: { type: 'string' },
                  lastN: { type: 'string' },
                  lastP: { type: 'string' },
                  lastK: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Preferences updated',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Envelope' },
                    {
                      type: 'object',
                      properties: { data: { $ref: '#/components/schemas/PlantPreference' } }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/plants/{plantId}/preferences/history': {
      get: {
        summary: 'Preference change history',
        tags: ['Plants'],
        parameters: [
          { $ref: '#/components/parameters/TraceIdHeader' },
          { name: 'plantId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Preference history list' }
        }
      }
    },
    '/plants/{plantId}/activities': {
      parameters: [
        { $ref: '#/components/parameters/TraceIdHeader' },
        { name: 'plantId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      get: {
        summary: 'List activities for a plant',
        tags: ['Activities'],
        parameters: [
          { name: 'kind', in: 'query', schema: { type: 'string' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          { name: 'cursor', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Activities list',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ActivityListResponse' } }
            }
          }
        }
      },
      post: {
        summary: 'Log an activity',
        tags: ['Activities'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['kind'],
                properties: {
                  id: { type: 'string' },
                  kind: { type: 'string' },
                  quantity: { type: 'string' },
                  unit: { type: 'string' },
                  npk: {
                    type: 'object',
                    properties: {
                      n: { type: 'string' },
                      p: { type: 'string' },
                      k: { type: 'string' }
                    }
                  },
                  note: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Activity created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Envelope' },
                    {
                      type: 'object',
                      properties: { data: { $ref: '#/components/schemas/Activity' } }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/plants/{plantId}/activities/{activityId}': {
      parameters: [
        { $ref: '#/components/parameters/TraceIdHeader' },
        { name: 'plantId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'activityId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      get: {
        summary: 'Get activity detail',
        tags: ['Activities'],
        responses: {
          '200': {
            description: 'Activity detail',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Envelope' },
                    {
                      type: 'object',
                      properties: { data: { $ref: '#/components/schemas/Activity' } }
                    }
                  ]
                }
              }
            }
          },
          '404': { description: 'Activity not found' }
        }
      },
      patch: {
        summary: 'Update activity',
        tags: ['Activities'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  kind: { type: 'string' },
                  quantity: { type: 'string' },
                  unit: { type: 'string' },
                  npk: { type: 'object' },
                  note: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Activity updated',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Envelope' },
                    {
                      type: 'object',
                      properties: { data: { $ref: '#/components/schemas/Activity' } }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Soft-delete activity',
        tags: ['Activities'],
        responses: {
          '204': { description: 'Deleted' }
        }
      }
    },
    '/analyses': {
      get: {
        summary: 'List analyses for current user',
        tags: ['Analyses'],
        parameters: [
          { $ref: '#/components/parameters/TraceIdHeader' },
          { name: 'plantId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'since', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          { name: 'cursor', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Analyses list',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AnalysisListResponse' } }
            }
          }
        }
      },
      post: {
        summary: 'Start a new analysis job',
        tags: ['Analyses'],
        parameters: [
          { $ref: '#/components/parameters/TraceIdHeader' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  plantId: { type: 'string' },
                  imageUrl: { type: 'string' },
                  imageBase64: { type: 'string' },
                  note: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Analysis queued/completed',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Envelope' },
                    {
                      type: 'object',
                      properties: { data: { $ref: '#/components/schemas/Analysis' } }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/analyses/{analysisId}': {
      parameters: [
        { $ref: '#/components/parameters/TraceIdHeader' },
        { name: 'analysisId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      get: {
        summary: 'Get analysis detail',
        tags: ['Analyses'],
        responses: {
          '200': {
            description: 'Analysis detail',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Envelope' },
                    {
                      type: 'object',
                      properties: { data: { $ref: '#/components/schemas/Analysis' } }
                    }
                  ]
                }
              }
            }
          },
          '404': { description: 'Analysis not found' }
        }
      }
    },
    '/analyses/{analysisId}/cancel': {
      post: {
        summary: 'Cancel analysis job',
        tags: ['Analyses'],
        parameters: [
          { $ref: '#/components/parameters/TraceIdHeader' },
          { name: 'analysisId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Analysis cancelled',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Envelope' },
                    {
                      type: 'object',
                      properties: { data: { $ref: '#/components/schemas/Analysis' } }
                    }
                  ]
                }
              }
            }
          },
          '409': { description: 'Analysis cannot be cancelled' }
        }
      }
    }
    ,
    '/notifications': {
      get: {
        summary: 'List notifications',
        tags: ['Notifications'],
        parameters: [
          { $ref: '#/components/parameters/TraceIdHeader' },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['reminder', 'ai', 'alert', 'achievement', 'system'] } },
          { name: 'unread', in: 'query', schema: { type: 'boolean' } },
          { name: 'updatedSince', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          { name: 'cursor', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Notifications list',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/NotificationListResponse' } }
            }
          }
        }
      }
    },
    '/notifications/mark-read': {
      post: {
        summary: 'Mark notifications as read',
        tags: ['Notifications'],
        parameters: [
          { $ref: '#/components/parameters/TraceIdHeader' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ids'],
                properties: {
                  ids: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Update count returned' }
        }
      }
    },
    '/notifications/subscriptions': {
      get: {
        summary: 'List notification subscriptions',
        tags: ['Notifications'],
        parameters: [
          { $ref: '#/components/parameters/TraceIdHeader' }
        ],
        responses: {
          '200': {
            description: 'Subscriptions list',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Envelope' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            nodes: { type: 'array', items: { $ref: '#/components/schemas/NotificationSubscription' } }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/notifications/subscribe': {
      post: {
        summary: 'Subscribe device for notifications',
        tags: ['Notifications'],
        parameters: [
          { $ref: '#/components/parameters/TraceIdHeader' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['deviceId', 'pushToken'],
                properties: {
                  deviceId: { type: 'string' },
                  pushToken: { type: 'string' },
                  platform: { type: 'string', enum: ['expo', 'apns', 'fcm'] },
                  locale: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Subscription created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Envelope' },
                    {
                      type: 'object',
                      properties: { data: { $ref: '#/components/schemas/NotificationSubscription' } }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/notifications/subscribe/{subscriptionId}': {
      delete: {
        summary: 'Unsubscribe device token',
        tags: ['Notifications'],
        parameters: [
          { $ref: '#/components/parameters/TraceIdHeader' },
          { name: 'subscriptionId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '204': { description: 'Unsubscribed' }
        }
      }
    },
    '/insights/summary': {
      get: {
        summary: 'Summary insights metrics',
        tags: ['Insights'],
        parameters: [
          { $ref: '#/components/parameters/TraceIdHeader' },
          { name: 'plantId', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Summary metrics',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InsightSummaryResponse' }
              }
            }
          }
        }
      }
    },
    '/insights/trends': {
      get: {
        summary: 'Trend insights',
        tags: ['Insights'],
        parameters: [
          { $ref: '#/components/parameters/TraceIdHeader' },
          { name: 'metric', in: 'query', required: true, schema: { type: 'string', enum: ['wateringConsistency', 'fertilizerBalance', 'plantHealthIndex'] } },
          { name: 'window', in: 'query', required: true, schema: { type: 'string', enum: ['7d', '30d', '90d'] } },
          { name: 'compareTo', in: 'query', schema: { type: 'string', enum: ['previous'] } },
          { name: 'plantId', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Trend metrics',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InsightTrendResponse' }
              }
            }
          }
        }
      }
    }
  }
};
