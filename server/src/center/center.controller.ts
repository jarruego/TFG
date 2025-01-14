
import { Controller, Post, Body, Put, Param, Get } from '@nestjs/common';
import { CreateCenterDTO } from '../dto/center/create-center.dto';
import { UpdateCenterDTO } from '../dto/center/update-center.dto';
import { CenterService } from './center.service';

@Controller('center')
export class CenterController {
  constructor(private readonly centerService: CenterService) {}

  @Post()
  async create(@Body() createCenterDTO: CreateCenterDTO) {
    return this.centerService.create(createCenterDTO);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCenterDTO: UpdateCenterDTO) {
    const numericId = parseInt(id, 10);
    return this.centerService.update(numericId, updateCenterDTO);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    return this.centerService.findById(numericId);
  }
}