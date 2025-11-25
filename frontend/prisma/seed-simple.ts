import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 生成随机钱包地址
function generateWalletAddress(): string {
  return (
    '0x' +
    Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('')
  );
}

const projectTemplates = [
  { name: 'DeFi Revolution', symbol: 'DEFI' },
  { name: 'NFT Marketplace', symbol: 'NFT' },
  { name: 'Web3 Social', symbol: 'WEB3' },
  { name: 'Gaming DAO', symbol: 'GAME' },
  { name: 'Creator Economy', symbol: 'CREATE' },
];

const contributionTexts = [
  'Implemented user authentication system',
  'Fixed critical bug in smart contract',
  'Created responsive dashboard UI',
  'Added automated tests',
  'Optimized database performance',
];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function main() {
  console.log('🌱 Starting simple seed...');

  // 创建用户
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        walletAddress: generateWalletAddress(),
        name: `User ${i}`,
        bio: `Test user ${i}`,
      },
    });
    users.push(user);
  }
  console.log(`✅ Created ${users.length} users`);

  // 创建项目
  const projects = [];
  for (let i = 0; i < projectTemplates.length; i++) {
    const template = projectTemplates[i];
    const owner = randomChoice(users);

    const project = await prisma.project.create({
      data: {
        key: template.name.toLowerCase().replace(/\s+/g, '-'),
        name: template.name,
        description: `A test project for ${template.name}`,
        tokenSymbol: template.symbol,
        ownerId: owner.id,
      },
    });
    projects.push(project);
  }
  console.log(`✅ Created ${projects.length} projects`);

  // 为每个项目创建贡献
  for (const project of projects) {
    for (let i = 0; i < 5; i++) {
      const contributor = randomChoice(users);

      const contribution = await prisma.contribution.create({
        data: {
          content: randomChoice(contributionTexts),
          hours: Math.round((Math.random() * 10 + 1) * 100) / 100,
          projectId: project.id,
        },
      });

      // 添加贡献者关联
      await prisma.contributionContributor.create({
        data: {
          contributionId: contribution.id,
          contributorId: contributor.id,
          hours: contribution.hours,
          points: Math.floor(Math.random() * 50) + 10,
        },
      });
    }
  }

  console.log('🎉 Simple seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
