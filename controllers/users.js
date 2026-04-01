let userModel = require("../schemas/users");
const roleModel = require("../schemas/roles");
const { generateRandomPassword } = require("../utils/randomPassword");
const { sendPasswordEmail } = require("../utils/mailHandler");
const ExcelJS = require('exceljs');
const path = require('path');
const mongoose = require('mongoose');

module.exports = {
    CreateAnUser: async function (username, password, email, role,session,
        fullName, avatarUrl, status, loginCount
    ) {
        let newItem = new userModel({
            username: username,
            password: password,
            email: email,
            fullName: fullName,
            avatarUrl: avatarUrl,
            status: status,
            role: role,
            loginCount: loginCount
        });
        await newItem.save({session});
        return newItem; 
    },
    GetAllUser: async function () {
        let users = await userModel
            .find({ isDeleted: false })
        return users;
    },
    GetAnUserByUsername: async function (username) {
        let user = await userModel
            .findOne({
                isDeleted: false,
                username: username
            })
        return user;
    },
    GetAnUserByEmail: async function (email) {
        let user = await userModel
            .findOne({
                isDeleted: false,
                email: email
            })
        return user;
    },
    GetAnUserByToken: async function (token) {
        let user = await userModel
            .findOne({
                isDeleted: false,
                forgotPasswordToken: token
            })
        if (user.forgotPasswordTokenExp > Date.now()) {
            return user;
        } else {
            return false;
        }

    },
    GetAnUserById: async function (id) {
        let user = await userModel
            .findOne({
                isDeleted: false,
                _id: id
            }).populate('role')
        return user;
    },

    /**
     * Import users from Excel file
     * Assumes columns: A=1=username, B=2=email, C=3=fullName
     */
    ImportUsersFromExcel: async function (filePath) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0];
        
        // Get 'user' role
        const userRole = await roleModel.findOne({ name: 'user', isDeleted: false });
        if (!userRole) {
            throw new Error("Role 'user' not found");
        }
        
        const results = { success: 0, failed: 0, errors: [] };
        const batchSize = 50;
        const totalRows = worksheet.rowCount;
        const batches = Math.ceil((totalRows - 1) / batchSize); // skip header
        
        for (let b = 0; b < batches; b++) {
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                const batchUsers = [];
                const startRow = b * batchSize + 2; // +2 skip header
                const endRow = Math.min(startRow + batchSize - 1, totalRows);
                
                for (let row = startRow; row <= endRow; row++) {
                    const usernameCell = worksheet.getCell(row, 1).value?.toString().trim();
                    const emailCell = worksheet.getCell(row, 2).value?.toString().trim();
                    const fullNameCell = worksheet.getCell(row, 3)?.value?.toString().trim() || '';
                    
                    if (!usernameCell || !emailCell) {
                        results.errors.push(`Row ${row}: Missing username or email`);
                        results.failed++;
                        continue;
                    }
                    
                    // Check duplicates
                    const existingUser = await userModel.findOne({
                        $or: [{ username: usernameCell }, { email: emailCell }],
                        isDeleted: false
                    });
                    if (existingUser) {
                        results.errors.push(`Row ${row}: User ${usernameCell}/${emailCell} already exists`);
                        results.failed++;
                        continue;
                    }
                    
                    const password = generateRandomPassword();
                    const newUser = new userModel({
                        username: usernameCell,
                        password, // will hash pre-save
                        email: emailCell,
                        fullName: fullNameCell,
                        role: userRole._id,
                        status: true
                    });
                    batchUsers.push(newUser);
                    
                    // Send email async
                    sendPasswordEmail(emailCell, usernameCell, password).catch(console.error);
                }
                
                if (batchUsers.length > 0) {
                    await userModel.insertMany(batchUsers, { session });
                    results.success += batchUsers.length;
                }
                
                await session.commitTransaction();
                await session.endSession();
            } catch (error) {
                await session.abortTransaction();
                await session.endSession();
                console.error(`Batch ${b} error:`, error);
                results.errors.push(`Batch ${b} failed: ${error.message}`);
            }
        }
        
        return results;
    }

}
