import { PrismaClient, Role, ApproveStatus, TaskStatus, HealthCategory, MetricType, StepType, RoadmapType, DocumentType, LifecyclePhase, ChangeRequestStatus, AssetType, ChannelType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  const tables = [
    'Organization', 'User', 'Workspace', 'Product', 'Project', 'Milestone', 'Task', 'Approval', 'Release', 'Document',
    'Workflow', 'WorkflowStep', 'WorkflowTransition', 'WorkflowExecution', 'ProductHealth', 'HealthMetric', 'HealthSnapshot',
    'StrategicGoal', 'Objective', 'KeyResult', 'Initiative', 'Roadmap', 'RoadmapItem', 'KnowledgeNode', 'KnowledgeEdge',
    'DecisionLog', 'ResourceAllocation', 'DeliveryLifecycle', 'Team', 'TeamMember', 'PerformanceScore', 'ChangeRequest',
    'Asset', 'Channel', 'ChannelMember', 'Message', 'Outcome', 'GovernancePolicy', 'AuditEvent', 'IntegrationState', 'MigrationSimulation'
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (e) {
      console.log(`Skipping truncation for ${table} if it does not exist.`);
    }
  }

  console.log('Seeding Healthcare SaaS Enterprise Data (MediCloud)...');

  // 1. Organization
  const org = await prisma.organization.create({
    data: { id: 'org_123', name: 'MediCloud Health Systems' }
  });

  // 2. Users
  const ceo = await prisma.user.create({ data: { email: 'ceo@medicloud.com', passwordHash: 'hash', firstName: 'Dr. Elena', lastName: 'Rostova', role: Role.CEO, organizationId: org.id } });
  const pm = await prisma.user.create({ data: { email: 'pm@medicloud.com', passwordHash: 'hash', firstName: 'Marcus', lastName: 'Chen', role: Role.PRODUCT_MANAGER, organizationId: org.id } });
  const dev1 = await prisma.user.create({ data: { email: 'dev1@medicloud.com', passwordHash: 'hash', firstName: 'Sarah', lastName: 'Jenkins', role: Role.DEVELOPER, organizationId: org.id } });
  const dev2 = await prisma.user.create({ data: { email: 'dev2@medicloud.com', passwordHash: 'hash', firstName: 'David', lastName: 'Kim', role: Role.DEVELOPER, organizationId: org.id } });
  const secLead = await prisma.user.create({ data: { email: 'sec@medicloud.com', passwordHash: 'hash', firstName: 'Anita', lastName: 'Patel', role: Role.ORG_ADMIN, organizationId: org.id } });

  // 3. Workspace
  const workspace = await prisma.workspace.create({
    data: { id: 'default-workspace-id', name: 'Clinical Operations', organizationId: org.id }
  });

  // 4. Products & Projects
  const product = await prisma.product.create({
    data: { name: 'EHR Patient Portal', description: 'Next-gen Electronic Health Records interface for patients.', workspaceId: workspace.id }
  });

  const project = await prisma.project.create({
    data: { name: 'FHIR API Integration', description: 'Integrate external lab results via HL7 FHIR standards.', workspaceId: workspace.id }
  });

  // 5. Teams
  const hl7Team = await prisma.team.create({
    data: { name: 'HL7 Interoperability Squad', capacity: 200, utilization: 85, velocity: 56 }
  });
  const securityTeam = await prisma.team.create({
    data: { name: 'Compliance & Infosec', capacity: 120, utilization: 110, velocity: 20 }
  });

  await prisma.teamMember.createMany({
    data: [
      { userId: pm.id, teamId: hl7Team.id, skills: ['Product Management', 'Healthcare IT'] },
      { userId: dev1.id, teamId: hl7Team.id, skills: ['Node.js', 'FHIR'] },
      { userId: dev2.id, teamId: hl7Team.id, skills: ['PostgreSQL', 'HIPAA Compliance'] },
      { userId: secLead.id, teamId: securityTeam.id, skills: ['Cybersecurity', 'SOC2'] }
    ]
  });

  // 6. Performance Scores
  await prisma.performanceScore.create({ data: { userId: dev1.id, contributionScore: 9.2, deliveryScore: 88, collaborationScore: 9.5, burnoutRisk: 0.2 } });
  await prisma.performanceScore.create({ data: { userId: dev2.id, contributionScore: 8.7, deliveryScore: 95, collaborationScore: 8.0, burnoutRisk: 0.85 } }); // High burnout

  // 7. Documents
  const prd = await prisma.document.create({
    data: {
      title: 'FHIR Lab Results PRD (v1.4)',
      content: '## Goal\nEnable seamless importing of Quest and LabCorp results.\n\n## Security\nMust enforce end-to-end encryption for ePHI.',
      type: DocumentType.PRD,
      productId: product.id
    }
  });

  // 8. Communication Hub
  const channel = await prisma.channel.create({
    data: { name: 'fhir-integration', type: ChannelType.PROJECT, projectId: project.id }
  });
  await prisma.channelMember.create({ data: { userId: pm.id, channelId: channel.id } });
  await prisma.channelMember.create({ data: { userId: dev1.id, channelId: channel.id } });
  await prisma.message.create({ data: { content: "Epic has updated their sandbox API. We need to adapt the mapping layer.", channelId: channel.id, senderId: pm.id } });

  // 9. Workflow / Lifecycles
  await prisma.deliveryLifecycle.create({
    data: { projectId: project.id, phase: LifecyclePhase.DEVELOPMENT, ownerTeamId: hl7Team.id }
  });

  // 10. Governance & Audit
  await prisma.governancePolicy.create({
    data: { dataResidency: 'US-East (HIPAA)', retentionDays: 2555, encryptionLevel: 'AES-256 BYOK', backupFrequency: 'Hourly' }
  });
  
  await prisma.auditEvent.createMany({
    data: [
      { entityType: 'User', entityId: dev1.id, action: 'LOGIN', actorId: dev1.id, ipAddress: '192.168.1.42' },
      { entityType: 'Policy', entityId: 'sys', action: 'UPDATE_RETENTION', actorId: secLead.id, beforeState: '365', afterState: '2555', ipAddress: '10.0.0.5' },
      { entityType: 'Export', entityId: 'pat_data', action: 'DATA_EXPORT_DENIED', actorId: dev2.id, ipAddress: 'External_IP' }
    ]
  });

  // 11. Integrations
  await prisma.integrationState.createMany({
    data: [
      { provider: 'GitHub Enterprise', status: 'Connected', syncHealth: 99.9, errorCount: 0, lastSync: new Date() },
      { provider: 'Slack Workspace', status: 'Connected', syncHealth: 100.0, errorCount: 0, lastSync: new Date() },
      { provider: 'Salesforce Health Cloud', status: 'Warning', syncHealth: 85.4, errorCount: 12, lastSync: new Date(Date.now() - 3600000) }
    ]
  });

  // 12. Migration
  await prisma.migrationSimulation.create({
    data: { sourceSystem: 'Legacy Cerner DB', status: 'Conversion', totalRecords: 1450000, migratedRecords: 890000, errorRecords: 420 }
  });

  // 13. Outcomes
  await prisma.outcome.create({
    data: {
      businessGoals: 'Reduce manual charting by 30%',
      kpiTargets: 'Provider satisfaction > 8/10',
      kpiAchievement: 85.0,
      roi: 240.5,
      customerImpact: 'Nurses save 45 mins/shift.',
      strategicSuccess: 'High'
    }
  });

  // 14. Product Health & Metrics
  const health = await prisma.productHealth.create({
    data: { productId: product.id, score: 82.5, category: HealthCategory.YELLOW }
  });
  await prisma.healthMetric.createMany({
    data: [
      { healthId: health.id, type: MetricType.VELOCITY, value: 56.0 },
      { healthId: health.id, type: MetricType.DEFECT_DENSITY, value: 4.2 },
      { healthId: health.id, type: MetricType.BLOCKED_WORK, value: 12.0 }
    ]
  });

  // 15. Strategy (Roadmap & Goals)
  const goal = await prisma.strategicGoal.create({ data: { name: 'Expand Telehealth Offerings Q3' } });
  const objective = await prisma.objective.create({ data: { goalId: goal.id, name: 'Launch Virtual Triage' } });
  await prisma.keyResult.create({ data: { objectiveId: objective.id, name: 'Achieve 5,000 virtual consults/week', target: 5000, current: 1200 } });
  const initiative = await prisma.initiative.create({ data: { objectiveId: objective.id, name: 'AI Symptom Checker' } });
  const roadmap = await prisma.roadmap.create({ data: { name: 'Q3 Product Portfolio', type: RoadmapType.PORTFOLIO } });
  await prisma.roadmapItem.create({
    data: { roadmapId: roadmap.id, initiativeId: initiative.id, startDate: new Date('2026-07-01'), endDate: new Date('2026-09-30'), status: 'ON_TRACK' }
  });

  // 16. Workflow Engine
  const wf = await prisma.workflow.create({ data: { name: 'HIPAA Compliance Review', organizationId: org.id, isPublished: true } });
  await prisma.workflowStep.create({ data: { workflowId: wf.id, name: 'Legal Signoff', type: StepType.APPROVAL, config: { role: 'LEGAL' }, slaMinutes: 2880 } });

  // 17. Tasks & Approvals
  const task = await prisma.task.create({
    data: { title: 'Encrypt Database Volumes at Rest', description: 'Enable KMS encryption on all RDS instances.', status: TaskStatus.IN_PROGRESS, projectId: project.id, assigneeId: dev2.id }
  });
  await prisma.approval.create({
    data: { taskId: task.id, approverId: secLead.id, status: ApproveStatus.PENDING }
  });

  // 18. Decision Log
  await prisma.decisionLog.create({
    data: { title: 'Adopt FHIR R4 over R3', context: 'R4 provides better extensions for telemedicine.', ownerId: pm.id, outcome: 'Approved for Q3 roadmap' }
  });

  console.log('Seeding Complete! 🎉 MediCloud dataset is ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
