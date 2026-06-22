import { Controller, Get, Post, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CartService } from './cart.service.js';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a cart (placeholder)' })
  @ApiResponse({ status: 200, description: 'Cart placeholder' })
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart (placeholder)' })
  @ApiResponse({ status: 201, description: 'Cart item placeholder' })
  addItem() {
    return this.cartService.addItem();
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from cart (placeholder)' })
  @ApiResponse({ status: 200, description: 'Cart item removal placeholder' })
  removeItem(@Param('id') id: string) {
    return this.cartService.removeItem();
  }
}
