"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reaction = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const message_entity_1 = require("./message.entity");
let Reaction = class Reaction {
    id;
    emoji;
    user;
    message;
    messageId;
    createdAt;
};
exports.Reaction = Reaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Reaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Reaction.prototype, "emoji", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: true }),
    __metadata("design:type", user_entity_1.User)
], Reaction.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => message_entity_1.Message, (message) => message.reactions),
    __metadata("design:type", message_entity_1.Message)
], Reaction.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Reaction.prototype, "messageId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Reaction.prototype, "createdAt", void 0);
exports.Reaction = Reaction = __decorate([
    (0, typeorm_1.Entity)('reactions')
], Reaction);
//# sourceMappingURL=reaction.entity.js.map