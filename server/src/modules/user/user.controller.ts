import { Body, Controller, Put, Delete, Request, Response, UseGuards, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateProfileDto, UpdatePasswordDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const userId = req.user.userId;
    // We can also extract select fields to update to avoid arbitrary data override.
    const data: Partial<{ fullName: string; avatar: string }> = {};
    if (updateProfileDto.fullName) {
      data.fullName = updateProfileDto.fullName;
    }
    if (updateProfileDto.avatar) {
      data.avatar = updateProfileDto.avatar;
    }
    
    const user = await this.userService.update(userId, data);
    // Remove password before sending back
    delete (user as any).password;
    return user;
  }

  @Put('password')
  async updatePassword(@Request() req, @Body() updatePasswordDto: UpdatePasswordDto) {
    const userId = req.user.userId;
    const user = await this.userService.findOne(userId);

    // Verify current password if user has one
    if (user.password && updatePasswordDto.currentPassword) {
      const isPasswordValid = await argon2.verify(user.password, updatePasswordDto.currentPassword);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid current password');
      }
    } else if (user.password && !updatePasswordDto.currentPassword) {
      throw new BadRequestException('Current password is required');
    }
    
    await this.userService.update(userId, {
      password: updatePasswordDto.newPassword,
    });
    
    return { success: true, message: 'Password updated successfully' };
  }

  @Delete('account')
  async deleteAccount(@Request() req, @Response({ passthrough: true }) res) {
    const userId = req.user.userId;
    
    // Attempt to delete user from database
    await this.userService.delete(userId);
    
    // Clear auth cookie
    res.clearCookie('user_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
    
    return res.status(200).json({ success: true, message: 'Account deleted successfully' });
  }
}


