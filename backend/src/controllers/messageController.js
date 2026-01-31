const Message = require('../models/messageModel');
const Notification = require('../models/notificationModel');
const Property = require('../models/propertyModel');
const response = require('../utils/response');
const { v4: uuidv4 } = require('uuid');
const { getIO } = require('../utils/socket');

const messageController = {
    /**
     * Get all messages for current user
     */
    async getUserMessages(req, res, next) {
        try {
            const userId = req.user.id;
            const messages = await Message.findByUserId(userId);
            return response.success(res, messages);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Send a message (candidature)
     */
    async sendMessage(req, res, next) {
        try {
            const { receiver_id, message, property_id } = req.body;
            const sender_id = req.user.id;
            const messageId = uuidv4();

            const newMessage = await Message.create({
                id: messageId,
                sender_id,
                receiver_id,
                message,
                property_id
            });

            // Emit real-time message via Socket.io
            try {
                const io = getIO();
                io.to(receiver_id).emit('new_message', newMessage);
                console.log(`[SOCKET] Message emitted to user ${receiver_id}`);
            } catch (socketError) {
                console.warn('[SOCKET] Could not emit message:', socketError.message);
            }

            // Automatically trigger a notification for the receiver
            try {
                // If it's a property application, provide a link and specific title
                let notificationTitle = "Nouveau message";
                let notificationLink = "/owner-dashboard?tab=messages";

                if (property_id) {
                    const property = await Property.findById(property_id);
                    if (property) {
                        notificationTitle = "Nouvelle candidature";
                        notificationLink = `/owner-dashboard?tab=messages&propertyId=${property_id}`;
                    }
                }

                await Notification.create({
                    id: uuidv4(),
                    user_id: receiver_id,
                    type: "message",
                    title: notificationTitle,
                    message: "Vous avez reçu un nouveau message concernant un bien.",
                    link: notificationLink
                });
            } catch (notifError) {
                console.error("Failed to create auto-notification:", notifError);
            }

            return response.success(res, newMessage, 'Message sent', 201);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Mark messages as read
     */
    async markAsRead(req, res, next) {
        try {
            const { messageIds } = req.body;
            const userId = req.user.id;

            if (!messageIds || !Array.isArray(messageIds)) {
                return response.error(res, 'messageIds must be an array', 400);
            }

            await Message.markAsRead(messageIds, userId);

            // Also mark message-type notifications as read for this user
            try {
                await Notification.markAllAsRead(userId, 'message');
            } catch (notifError) {
                console.error("Failed to clear message notifications:", notifError);
            }

            return response.success(res, null, 'Messages marked as read');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Delete a message
     */
    async deleteMessage(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const deleted = await Message.delete(id, userId);
            if (!deleted) {
                return response.error(res, 'Message not found or unauthorized', 404);
            }

            return response.success(res, null, 'Message deleted successfully');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = messageController;
