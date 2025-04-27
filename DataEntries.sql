/*
 Navicat Premium Data Transfer

 Source Server         : 10.88.18.166
 Source Server Type    : MySQL
 Source Server Version : 90300
 Source Host           : 10.88.18.166:13306
 Source Schema         : txt2sql

 Target Server Type    : MySQL
 Target Server Version : 90300
 File Encoding         : 65001

 Date: 27/04/2025 22:13:17
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for DataEntries
-- ----------------------------
DROP TABLE IF EXISTS `DataEntries`;
CREATE TABLE `DataEntries`  (
  `ID` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `ProjectName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '项目名称',
  `Question` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '问题',
  `Answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '回答',
  `RoleTip` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '系统提示',
  `COT` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '思维链',
  `Confirm` int NULL DEFAULT NULL COMMENT '确认状态',
  `LastEdit` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '修改人',
  `UpdateTime` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`ID`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 481 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
