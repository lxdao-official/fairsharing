import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 模拟钱包地址生成
function generateWalletAddress(): string {
  return (
    '0x' +
    Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('')
  );
}

// 生成随机的项目名称
const projectNames = [
  'DeFi Revolution',
  'NFT Marketplace',
  'Web3 Social',
  'DeFi Staking',
  'Layer 2 Bridge',
  'DAO Governance',
  'Metaverse World',
  'Crypto Exchange',
  'Yield Farming',
  'GameFi Platform',
  'Cross-chain Swap',
  'DEX Aggregator',
  'Lending Protocol',
  'Insurance DAO',
  'Prediction Market',
  'Music NFT',
  'Art Gallery',
  'Gaming Guild',
  'Carbon Credits',
  'Real Estate',
  'Supply Chain',
  'Identity Verification',
  'Charity Platform',
  'Education DAO',
  'Creator Economy',
  'Freelancer DAO',
  'Investment Fund',
  'Treasury Management',
];

// 生成随机的贡献内容
const contributionTemplates = [
  'Implemented smart contract for token distribution',
  'Fixed bug in user authentication system',
  'Created responsive UI components for dashboard',
  'Optimized database queries for better performance',
  'Added unit tests for core functionality',
  'Deployed smart contracts to testnet',
  'Designed user experience for mobile app',
  'Integrated third-party API for price feeds',
  'Refactored codebase for better maintainability',
  'Conducted security audit of smart contracts',
  'Wrote technical documentation',
  'Implemented automated testing pipeline',
  'Created marketing materials and graphics',
  'Built analytics dashboard for tracking metrics',
  'Developed API endpoints for external integrations',
];

// 生成随机的用户名
const userNames = [
  'Alice Chen',
  'Bob Smith',
  'Charlie Davis',
  'Diana Lee',
  'Eve Wilson',
  'Frank Brown',
  'Grace Kim',
  'Henry Zhang',
  'Ivy Rodriguez',
  'Jack Taylor',
  'Kate Johnson',
  'Liam Wang',
  'Mia Garcia',
  'Noah Martinez',
  'Olivia Anderson',
  'Paul Thompson',
  'Quinn Lopez',
  'Rachel Harris',
  'Sam Clark',
  'Tina Lewis',
];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

async function main() {
  console.log('🌱 Starting to seed database...');

  // 1. 创建用户
  console.log('👥 Creating users...');
  const users = [];
  for (let i = 0; i < 30; i++) {
    const user = await prisma.user.create({
      data: {
        walletAddress: generateWalletAddress(),
        name: randomChoice(userNames) + ` ${i + 1}`,
        bio: `Web3 developer and blockchain enthusiast ${i + 1}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
        createdAt: randomDate(new Date('2023-01-01'), new Date()),
      },
    });
    users.push(user);
  }
  console.log(`✅ Created ${users.length} users`);

  // 2. 创建项目
  console.log('🚀 Creating projects...');
  const projects = [];
  for (let i = 0; i < 20; i++) {
    const owner = randomChoice(users);
    const projectName = randomChoice(projectNames);
    const project = await prisma.project.create({
      data: {
        key: projectName.toLowerCase().replace(/\s+/g, '-') + `-${i}`,
        name: projectName,
        description: `A revolutionary ${projectName.toLowerCase()} project that aims to transform the blockchain ecosystem through innovative solutions and community-driven development.`,
        logo: `https://api.dicebear.com/7.x/shapes/svg?seed=project${i}`,
        tokenSymbol: projectName.replace(/\s+/g, '').slice(0, 5).toUpperCase(),
        ownerId: owner.id,
        status: randomChoice([
          'ACTIVE',
          'ACTIVE',
          'ACTIVE',
          'PAUSED',
          'COMPLETED',
        ]),
        validateType: randomChoice(['SPECIFIC_MEMBERS', 'ALL_MEMBERS']),
        submitStrategy: randomChoice(['EVERYONE', 'RESTRICTED']),
        defaultHourRate: randomNumber(20, 100),
        approvalStrategy: {
          strategy: randomChoice(['simple', 'quorum', 'absolute', 'relative']),
          periodDays: randomNumber(1, 7),
        },
        links: {
          otherLinks: [
            {
              type: 'website',
              url: `https://${projectName
                .toLowerCase()
                .replace(/\s+/g, '')}.com`,
            },
            {
              type: 'github',
              url: `https://github.com/${projectName
                .toLowerCase()
                .replace(/\s+/g, '')}`,
            },
          ],
        },
        createdAt: randomDate(new Date('2023-01-01'), new Date()),
      },
    });
    projects.push(project);
  }
  console.log(`✅ Created ${projects.length} projects`);

  // 3. 创建项目成员
  console.log('👨‍💼 Creating project members...');
  let memberCount = 0;
  for (const project of projects) {
    // 每个项目随机添加3-8个成员
    const memberUsers = users
      .filter((u) => u.id !== project.ownerId)
      .sort(() => 0.5 - Math.random())
      .slice(0, randomNumber(3, 8));

    for (const user of memberUsers) {
      await prisma.projectMember.create({
        data: {
          userId: user.id,
          projectId: project.id,
          role: [randomChoice(['ADMIN', 'VALIDATOR', 'CONTRIBUTOR'])],
          createdAt: randomDate(project.createdAt, new Date()),
        },
      });
      memberCount++;
    }
  }
  console.log(`✅ Created ${memberCount} project members`);

  // 4. 创建项目关注
  console.log('❤️ Creating project follows...');
  let followCount = 0;
  for (const project of projects) {
    // 每个项目随机获得5-15个关注者
    const followers = users
      .sort(() => 0.5 - Math.random())
      .slice(0, randomNumber(5, 15));

    for (const follower of followers) {
      try {
        await prisma.projectFollow.create({
          data: {
            userId: follower.id,
            projectId: project.id,
            createdAt: randomDate(project.createdAt, new Date()),
          },
        });
        followCount++;
      } catch (error) {
        // 忽略重复关注错误
      }
    }
  }
  console.log(`✅ Created ${followCount} project follows`);

  // 5. 创建贡献
  console.log('💼 Creating contributions...');
  const contributions = [];
  for (const project of projects) {
    // 每个项目创建10-30个贡献
    const contributionCount = randomNumber(10, 30);
    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId: project.id },
      include: { user: true },
    });

    for (let i = 0; i < contributionCount; i++) {
      const contributor = randomChoice([
        ...projectMembers.map((m) => m.user),
        { id: project.ownerId },
      ]);
      const contribution = await prisma.contribution.create({
        data: {
          content: randomChoice(contributionTemplates),
          hours: Math.round((Math.random() * 20 + 1) * 100) / 100, // 1-20小时，保留2位小数
          tags: [
            randomChoice([
              'frontend',
              'backend',
              'smart-contract',
              'design',
              'documentation',
            ]),
            randomChoice([
              'bug-fix',
              'feature',
              'optimization',
              'security',
              'testing',
            ]),
          ],
          projectId: project.id,
          status: randomChoice([
            'VALIDATING',
            'PASSED',
            'PASSED',
            'FAILED',
            'ON_CHAIN',
          ]),
          startAt: randomDate(project.createdAt, new Date()),
          endAt: randomDate(project.createdAt, new Date()),
          createdAt: randomDate(project.createdAt, new Date()),
        },
      });

      // 为贡献添加贡献者
      await prisma.contributionContributor.create({
        data: {
          contributionId: contribution.id,
          contributorId: contributor.id,
          hours: contribution.hours,
          points: randomNumber(10, 100),
        },
      });

      contributions.push(contribution);
    }
  }
  console.log(`✅ Created ${contributions.length} contributions`);

  // 6. 创建投票
  console.log('🗳️ Creating votes...');
  let voteCount = 0;
  for (const contribution of contributions) {
    // 只为VALIDATING和部分PASSED的贡献创建投票
    if (
      contribution.status === 'VALIDATING' ||
      (contribution.status === 'PASSED' && Math.random() < 0.7)
    ) {
      const project = projects.find((p) => p.id === contribution.projectId);
      if (!project) continue;

      const projectMembers = await prisma.projectMember.findMany({
        where: {
          projectId: project.id,
          role: { has: 'VALIDATOR' },
        },
      });

      // 随机选择一些验证者投票
      const voters = projectMembers
        .sort(() => 0.5 - Math.random())
        .slice(0, randomNumber(1, Math.min(projectMembers.length, 5)));

      for (const voter of voters) {
        try {
          await prisma.vote.create({
            data: {
              type: randomChoice(['PASS', 'PASS', 'PASS', 'FAIL', 'SKIP']), // 偏向通过
              voterId: voter.userId,
              contributionId: contribution.id,
              createdAt: randomDate(contribution.createdAt, new Date()),
            },
          });
          voteCount++;
        } catch (error) {
          // 忽略重复投票错误
        }
      }
    }
  }
  console.log(`✅ Created ${voteCount} votes`);

  console.log('🎉 Database seeding completed successfully!');
  console.log(`
📊 Summary:
- Users: ${users.length}
- Projects: ${projects.length}
- Project Members: ${memberCount}
- Project Follows: ${followCount}
- Contributions: ${contributions.length}
- Votes: ${voteCount}
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
