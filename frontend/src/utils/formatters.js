// Number, Currency, and Text formatters

export const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const formatNumber = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return new Intl.NumberFormat('en-US').format(Math.round(val));
};

export const formatDecimal = (val, decimals = 2) => {
  if (val === undefined || val === null || isNaN(val)) return '0.00';
  return Number(val).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatPercentage = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0.0%';
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
};

// Service Colors for Charts
export const SERVICE_COLORS = {
  'Amazon EC2': '#FF9900',       // AWS Orange
  'Amazon S3': '#10B981',        // Emerald Green
  'Amazon RDS': '#3B82F6',       // Blue
  'AWS Lambda': '#8B5CF6',       // Purple
  'Amazon DynamoDB': '#EC4899',   // Pink
  'Amazon CloudFront': '#06B6D4', // Cyan
  'Amazon CloudWatch': '#F59E0B', // Amber
  'Amazon ECS': '#6366F1',        // Indigo
  'AWS Athena': '#14B8A6',       // Teal
  'Amazon SNS/SQS': '#E11D48',    // Rose
};

export const DEFAULT_PALETTE = [
  '#FF9900', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
  '#06B6D4', '#F59E0B', '#6366F1', '#14B8A6', '#E11D48',
  '#84CC16', '#A855F7', '#0EA5E9', '#F97316'
];

export const getServiceColor = (serviceName, index = 0) => {
  return SERVICE_COLORS[serviceName] || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
};

export const getSeverityBadgeClass = (severity) => {
  switch (severity?.toUpperCase()) {
    case 'HIGH':
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    case 'MEDIUM':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'LOW':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'INFO':
    default:
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  }
};
