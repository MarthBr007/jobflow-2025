import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    if (req.method === 'GET') {
        try {
            const { roomId, limit = 50, offset = 0 } = req.query;

            if (!roomId) {
                return res.status(400).json({ error: 'Room ID required' });
            }

            // Verify user is member of the room
            const membership = await prisma.chatRoomMember.findFirst({
                where: {
                    roomId: roomId as string,
                    userId,
                },
            });

            if (!membership) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const messages = await prisma.chatMessage.findMany({
                where: {
                    roomId: roomId as string,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true,
                        },
                    },
                    replyTo: {
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    reactions: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: parseInt(limit as string),
                skip: parseInt(offset as string),
            });

            // Format messages
            const formattedMessages = messages.map((message: any) => ({
                id: message.id,
                content: message.content,
                senderId: message.senderId,
                senderName: message.sender.name,
                senderAvatar: message.sender.profileImage,
                timestamp: message.createdAt.toISOString(),
                type: message.type.toLowerCase(),
                attachments: message.attachments ? JSON.parse(message.attachments) : [],
                reactions: message.reactions.reduce((acc: any, reaction: any) => {
                    if (!acc[reaction.emoji]) {
                        acc[reaction.emoji] = {
                            emoji: reaction.emoji,
                            count: 0,
                            users: [],
                        };
                    }
                    acc[reaction.emoji].count++;
                    acc[reaction.emoji].users.push(reaction.user.name);
                    return acc;
                }, {} as any),
                replyTo: message.replyTo ? {
                    id: message.replyTo.id,
                    content: message.replyTo.content,
                    senderName: message.replyTo.sender.name,
                } : null,
                isEdited: message.isEdited,
                editedAt: message.editedAt?.toISOString(),
            }));

            res.status(200).json({
                success: true,
                messages: formattedMessages.reverse(),
                hasMore: messages.length === parseInt(limit as string),
            });

        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ error: 'Internal server error' });
        }

    } else if (req.method === 'POST') {
        try {
            const { roomId, content, attachments, replyToId } = req.body;

            if (!roomId || !content) {
                return res.status(400).json({ error: 'Room ID and content required' });
            }

            // Verify user is member of the room
            const membership = await prisma.chatRoomMember.findFirst({
                where: {
                    roomId,
                    userId,
                },
            });

            if (!membership) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Create message
            const message = await prisma.chatMessage.create({
                data: {
                    content,
                    senderId: userId,
                    roomId,
                    type: attachments && attachments.length > 0 ? 'MEDIA' : 'TEXT',
                    attachments: attachments ? JSON.stringify(attachments) : null,
                    replyToId: replyToId || null,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true,
                        },
                    },
                    replyTo: {
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });

            // Update room last activity
            await prisma.chatRoom.update({
                where: { id: roomId },
                data: { lastActivity: new Date() },
            });

            // Format response
            const formattedMessage = {
                id: message.id,
                content: message.content,
                senderId: message.senderId,
                senderName: message.sender.name,
                senderAvatar: message.sender.profileImage,
                roomId: message.roomId,
                timestamp: message.createdAt.toISOString(),
                type: message.type.toLowerCase(),
                attachments: message.attachments ? JSON.parse(message.attachments) : [],
                replyTo: message.replyTo ? {
                    id: message.replyTo.id,
                    content: message.replyTo.content,
                    senderName: message.replyTo.sender.name,
                } : null,
            };

            res.status(201).json({
                success: true,
                message: formattedMessage,
            });

        } catch (error) {
            console.error('Error creating message:', error);
            res.status(500).json({ error: 'Internal server error' });
        }

    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
} 