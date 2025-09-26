#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

interface TestConfig {
  name: string;
  command: string;
  description: string;
  required: boolean;
  timeout?: number;
}

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  output?: string;
  error?: string;
}

class IntegrationTestRunner {
  private testConfigs: TestConfig[] = [
    {
      name: 'auth-integration',
      command: 'npx jest tests/integration/auth.test.ts --verbose',
      description: 'Authentication integration tests',
      required: true,
      timeout: 30000,
    },
    {
      name: 'ai-integration',
      command: 'npx jest tests/integration/ai.test.ts --verbose',
      description: 'AI services integration tests',
      required: true,
      timeout: 45000,
    },
    {
      name: 'backend-health',
      command: 'curl -f http://localhost:3000/v1/health',
      description: 'Backend health check',
      required: true,
      timeout: 5000,
    },
    {
      name: 'backend-versions',
      command: 'curl -f http://localhost:3000/v1/versions',
      description: 'API versioning check',
      required: true,
      timeout: 5000,
    },
    {
      name: 'rate-limiting',
      command: 'node scripts/test-rate-limiting.js',
      description: 'Rate limiting functionality',
      required: false,
      timeout: 10000,
    },
    {
      name: 'cache-performance',
      command: 'node scripts/test-cache-performance.js',
      description: 'Cache performance tests',
      required: false,
      timeout: 15000,
    },
  ];

  private results: TestResult[] = [];

  async runTests(options: { skipOptional?: boolean; parallel?: boolean } = {}): Promise<void> {
    console.log('🚀 Starting Integration Test Suite');
    console.log('=====================================\n');

    // Filter tests based on options
    const testsToRun = options.skipOptional
      ? this.testConfigs.filter(test => test.required)
      : this.testConfigs;

    console.log(`Running ${testsToRun.length} tests...\n`);

    // Run tests
    if (options.parallel) {
      await this.runTestsParallel(testsToRun);
    } else {
      await this.runTestsSequential(testsToRun);
    }

    // Display results
    this.displayResults();

    // Exit with appropriate code
    const hasFailures = this.results.some(result => !result.success);
    if (hasFailures) {
      console.log('\n❌ Some tests failed. Check the output above for details.');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed successfully!');
      process.exit(0);
    }
  }

  private async runTestsSequential(tests: TestConfig[]): Promise<void> {
    for (const test of tests) {
      await this.runSingleTest(test);
    }
  }

  private async runTestsParallel(tests: TestConfig[]): Promise<void> {
    const promises = tests.map(test => this.runSingleTest(test));
    await Promise.all(promises);
  }

  private async runSingleTest(test: TestConfig): Promise<void> {
    console.log(`🧪 Running: ${test.name}`);
    console.log(`   ${test.description}`);

    const startTime = Date.now();

    try {
      // Check if command exists for file-based commands
      if (test.command.includes('scripts/') && !existsSync(test.command.split(' ')[1])) {
        throw new Error(`Test script not found: ${test.command.split(' ')[1]}`);
      }

      const output = execSync(test.command, {
        encoding: 'utf8',
        timeout: test.timeout || 30000,
        stdio: 'pipe',
      });

      const duration = Date.now() - startTime;

      this.results.push({
        name: test.name,
        success: true,
        duration,
        output: output.trim(),
      });

      console.log(`   ✅ Passed (${duration}ms)\n`);
    } catch (error: any) {
      const duration = Date.now() - startTime;

      this.results.push({
        name: test.name,
        success: false,
        duration,
        error: error.message,
        output: error.stdout ? error.stdout.toString() : undefined,
      });

      console.log(`   ❌ Failed (${duration}ms)`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  private displayResults(): void {
    console.log('\n📊 Test Results Summary');
    console.log('========================');

    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total tests: ${this.results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total duration: ${totalDuration}ms`);
    console.log('');

    // Detailed results
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = `${result.duration}ms`;
      console.log(`${status} ${result.name.padEnd(20)} ${duration.padStart(8)}`);

      if (!result.success && result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });

    // Performance insights
    const slowTests = this.results
      .filter(r => r.success && r.duration > 5000)
      .sort((a, b) => b.duration - a.duration);

    if (slowTests.length > 0) {
      console.log('\n⚠️  Slow tests (>5s):');
      slowTests.forEach(test => {
        console.log(`   ${test.name}: ${test.duration}ms`);
      });
    }
  }

  async checkPrerequisites(): Promise<boolean> {
    console.log('🔍 Checking prerequisites...');

    const checks = [
      {
        name: 'Node.js',
        command: 'node --version',
        required: true,
      },
      {
        name: 'npm',
        command: 'npm --version',
        required: true,
      },
      {
        name: 'Jest',
        command: 'npx jest --version',
        required: true,
      },
      {
        name: 'TypeScript',
        command: 'npx tsc --version',
        required: true,
      },
      {
        name: 'Backend server',
        command: 'curl -f http://localhost:3000/v1/health',
        required: false,
      },
    ];

    let allPassed = true;

    for (const check of checks) {
      try {
        execSync(check.command, { stdio: 'pipe' });
        console.log(`   ✅ ${check.name}`);
      } catch (error) {
        if (check.required) {
          console.log(`   ❌ ${check.name} (required)`);
          allPassed = false;
        } else {
          console.log(`   ⚠️  ${check.name} (optional)`);
        }
      }
    }

    if (!allPassed) {
      console.log('\n❌ Some required prerequisites are missing.');
      console.log('Please install the missing dependencies and try again.');
      return false;
    }

    console.log('\n✅ All prerequisites check passed.');
    return true;
  }

  async setupTestEnvironment(): Promise<void> {
    console.log('🛠️  Setting up test environment...');

    try {
      // Clear test cache
      try {
        execSync('npx jest --clearCache', { stdio: 'pipe' });
        console.log('   ✅ Jest cache cleared');
      } catch (error) {
        console.log('   ⚠️  Could not clear Jest cache');
      }

      // Install dependencies if needed
      if (!existsSync('node_modules')) {
        console.log('   📦 Installing dependencies...');
        execSync('npm install', { stdio: 'inherit' });
      }

      // Build TypeScript if needed
      if (existsSync('tsconfig.json')) {
        console.log('   🔨 Building TypeScript...');
        execSync('npx tsc --noEmit', { stdio: 'pipe' });
        console.log('   ✅ TypeScript compilation successful');
      }

      console.log('✅ Test environment ready\n');
    } catch (error: any) {
      console.log(`❌ Failed to setup test environment: ${error.message}`);
      process.exit(1);
    }
  }

  generateReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
        duration: this.results.reduce((sum, r) => sum + r.duration, 0),
      },
      results: this.results,
    };

    const reportPath = join(process.cwd(), 'test-report.json');
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Test report saved to: ${reportPath}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    skipOptional: args.includes('--skip-optional'),
    parallel: args.includes('--parallel'),
    help: args.includes('--help') || args.includes('-h'),
  };

  if (options.help) {
    console.log(`
Integration Test Runner

Usage: ts-node scripts/test-runner.ts [options]

Options:
  --skip-optional    Skip optional tests
  --parallel         Run tests in parallel
  --help, -h         Show this help message

Examples:
  ts-node scripts/test-runner.ts
  ts-node scripts/test-runner.ts --skip-optional
  ts-node scripts/test-runner.ts --parallel
    `);
    process.exit(0);
  }

  const runner = new IntegrationTestRunner();

  try {
    // Check prerequisites
    const prereqsPassed = await runner.checkPrerequisites();
    if (!prereqsPassed) {
      process.exit(1);
    }

    // Setup environment
    await runner.setupTestEnvironment();

    // Run tests
    await runner.runTests(options);

    // Generate report
    runner.generateReport();
  } catch (error: any) {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { IntegrationTestRunner };