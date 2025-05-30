import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CircuitBreakerService } from '../services/circuit-breaker.service';
import { AdminGuard } from '../../common/guards/admin.guard';
import type { Request } from 'express';

/**
 * Controller for circuit breaker operations
 */
@ApiTags('Circuit Breaker')
@Controller('circuit-breaker')
@UseGuards(AdminGuard)
export class CircuitBreakerController {
  constructor(private readonly circuitBreakerService: CircuitBreakerService) {}

  /**
   * Get all circuits status
   */
  @Get()
  @ApiOperation({ summary: 'Get all circuits status' })
  @ApiResponse({
    status: 200,
    description: 'Returns all circuits with their current status',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          state: {
            type: 'string',
            enum: ['CLOSED', 'OPEN', 'HALF_OPEN', 'UNKNOWN'],
          },
          failures: { type: 'number' },
          lastFailure: { type: 'number' },
        },
      },
    },
  })
  getAllCircuits() {
    return this.circuitBreakerService.getAllCircuits();
  }

  /**
   * Get circuit status by name
   */
  @Get(':name')
  @ApiOperation({ summary: 'Get circuit status by name' })
  @ApiParam({ name: 'name', description: 'Circuit name', example: 'openai' })
  @ApiResponse({
    status: 200,
    description: 'Returns the circuit state',
    schema: {
      type: 'object',
      properties: {
        state: {
          type: 'string',
          enum: ['CLOSED', 'OPEN', 'HALF_OPEN', 'UNKNOWN'],
        },
      },
    },
  })
  getCircuitState(@Param('name') name: string) {
    const state = this.circuitBreakerService.getState(name);
    return { state };
  }

  /**
   * Reset circuit by name
   */
  @Post(':name/reset')
  @ApiOperation({ summary: 'Reset circuit by name' })
  @ApiParam({ name: 'name', description: 'Circuit name', example: 'openai' })
  @ApiResponse({
    status: 200,
    description: 'Circuit reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        circuit: { type: 'string' },
      },
    },
  })
  resetCircuit(@Param('name') name: string) {
    this.circuitBreakerService.resetCircuit(name);

    return {
      message: 'Circuit reset successfully',
      circuit: name,
    };
  }
}
