import config from '../../config.js'
import Query from '../../functions/Query.js';
import { client } from '../../index.js'
import { invites } from './Inv_FetchInvites.js'

export default {
	name: 'guildMemberAdd',

	async execute(member) {
		if(member.user.bot) return;
        if(!config.bot.invites.enabled) return;

        member.guild.invites.fetch().then(async newInvites => {
            const oldInvites = invites.get(member.guild.id)
            const invite = newInvites.find(i => i.uses > oldInvites.get(i.code))
            const inviter = client.users.cache.get(invite.inviter.id)
            const logChannel = member.guild.channels.cache.find(channel => channel.id === "779721531907506197")
            inviter && Query(`INSERT INTO ${config.mysql.tables.invites} (guildId, inviterId, invitedId) VALUES (?, ?, ?)`, [member.guild.id, inviter.id, member.user.id])
            inviter
            ? logChannel.send(`${member.user.tag} joined using invite code ${invite.code} from ${inviter.tag}. Invite was used ${invite.uses} times since its creation.`)
            : logChannel.send(`${member.user.tag} joined but I couldn't find through which invite.`);

            const Member = await member.guild.members.cache.get(inviter.id)

            if(inviter) {
                let count = await Query(`SELECT * FROM ${config.mysql.tables.invites} WHERE inviterId = ? AND guildId = ?`, [inviter.id, member.guild.id])

                if(config.bot.invites.levels[count.results.length]?.role) {
                    if(!config.bot.invites.stackRoles)
                        for (const [key, value] of Object.entries(config.bot.invites.levels))
                            await Member.roles.remove(value.role)
                        
                    await Member.roles.add(config.bot.invites.levels[count.results.length].role)
                }
            }
            
        })
	}
}