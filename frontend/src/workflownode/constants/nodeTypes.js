/*
=================================================================
FILE: workflownode/constants/nodeTypes.js
=================================================================
Node type definitions and configurations
*/

export const NODE_TYPES = {
  // Logic Nodes
  IF: 'if',
  SWITCH: 'switch',
  MERGE: 'merge',
  FILTER: 'filter',
  
  // Data Nodes
  SET_DATA: 'set_data',
  COMPARE_DATASETS: 'compare_datasets',
  
  // Flow Control
  LOOP: 'loop',
  WAIT: 'wait',
  STOP_AND_ERROR: 'stop_and_error',
  EXECUTE_SUB_WORKFLOW: 'execute_sub_workflow',
  
  // Facebook Nodes
  FACEBOOK_GET_PAGE_INFO: 'facebookGetPageInfo',
  FACEBOOK_POST_TO_PAGE: 'facebookPostToPage',
  FACEBOOK_GET_PAGE_POSTS: 'facebookGetPagePosts',
  FACEBOOK_GET_MESSAGES: 'facebookGetMessages',
  FACEBOOK_SEND_MESSAGE: 'facebookSendMessage',
  FACEBOOK_REPLY_MESSAGE: 'facebookReplyMessage',
  FACEBOOK_GET_POST_COMMENTS: 'facebookGetPostComments',
  FACEBOOK_REPLY_COMMENT: 'facebookReplyComment',
  FACEBOOK_GET_PAGE_INSIGHTS: 'facebookGetPageInsights',
  
  // LinkedIn Nodes
  LINKEDIN_GET_PROFILE: 'linkedinGetProfile',
  LINKEDIN_CREATE_POST: 'linkedinCreatePost',
  LINKEDIN_SEND_MESSAGE: 'linkedinSendMessage',
  LINKEDIN_GET_COMPANY: 'linkedinGetCompany',
  
  // WhatsApp Nodes
  WHATSAPP_TRIGGER: 'whatsappTrigger'
};

export const NODE_CATEGORIES = {
  CONDITIONAL_LOGIC: 'Conditional Logic',
  DATA_PROCESSING: 'Data Processing', 
  WORKFLOW_CONTROL: 'Workflow Control',
  ADVANCED_OPERATIONS: 'Advanced Operations',
  FACEBOOK: 'Facebook',
  LINKEDIN: 'LinkedIn',
  WHATSAPP: 'WhatsApp'
};

export const NODE_DEFINITIONS = [
  // Conditional Logic
  {
    type: NODE_TYPES.IF,
    category: NODE_CATEGORIES.CONDITIONAL_LOGIC,
    label: 'If',
    description: 'Route items to true/false branches based on conditions',
    icon: '🔀',
    color: '#10B981'
  },
  {
    type: NODE_TYPES.SWITCH,
    category: NODE_CATEGORIES.CONDITIONAL_LOGIC,
    label: 'Switch',
    description: 'Multi-path routing based on multiple rules',
    icon: '🔀',
    color: '#10B981'
  },
  
  // Data Processing
  {
    type: NODE_TYPES.FILTER,
    category: NODE_CATEGORIES.DATA_PROCESSING,
    label: 'Filter',
    description: 'Remove items based on filter conditions',
    icon: '🔍',
    color: '#3B82F6'
  },
  {
    type: NODE_TYPES.MERGE,
    category: NODE_CATEGORIES.DATA_PROCESSING,
    label: 'Merge',
    description: 'Combine data from multiple inputs',
    icon: '🔗',
    color: '#3B82F6'
  },
  {
    type: NODE_TYPES.SET_DATA,
    category: NODE_CATEGORIES.DATA_PROCESSING,
    label: 'Set Data',
    description: 'Create custom key-value pairs',
    icon: '📝',
    color: '#3B82F6'
  },
  
  // Workflow Control
  {
    type: NODE_TYPES.LOOP,
    category: NODE_CATEGORIES.WORKFLOW_CONTROL,
    label: 'Loop',
    description: 'Process data in batches or iterate over items',
    icon: '🔄',
    color: '#8B5CF6'
  },
  {
    type: NODE_TYPES.WAIT,
    category: NODE_CATEGORIES.WORKFLOW_CONTROL,
    label: 'Wait',
    description: 'Pause workflow execution',
    icon: '⏰',
    color: '#8B5CF6'
  },
  {
    type: NODE_TYPES.STOP_AND_ERROR,
    category: NODE_CATEGORIES.WORKFLOW_CONTROL,
    label: 'Stop and Error',
    description: 'Terminate workflow with error',
    icon: '🛑',
    color: '#EF4444'
  },
  
  // Advanced Operations
  {
    type: NODE_TYPES.COMPARE_DATASETS,
    category: NODE_CATEGORIES.ADVANCED_OPERATIONS,
    label: 'Compare Datasets',
    description: 'Compare two datasets and identify differences',
    icon: '⚖️',
    color: '#F59E0B'
  },
  {
    type: NODE_TYPES.EXECUTE_SUB_WORKFLOW,
    category: NODE_CATEGORIES.ADVANCED_OPERATIONS,
    label: 'Execute Sub Workflow',
    description: 'Run nested workflows',
    icon: '🎯',
    color: '#F59E0B'
  },
  
  // Facebook Nodes
  {
    type: NODE_TYPES.FACEBOOK_GET_PAGE_INFO,
    category: NODE_CATEGORIES.FACEBOOK,
    label: 'Get Page Info',
    description: 'Get Facebook page information and metrics',
    icon: '📘',
    color: '#1877F2'
  },
  {
    type: NODE_TYPES.FACEBOOK_POST_TO_PAGE,
    category: NODE_CATEGORIES.FACEBOOK,
    label: 'Post to Page',
    description: 'Post content to Facebook page',
    icon: '📝',
    color: '#1877F2'
  },
  {
    type: NODE_TYPES.FACEBOOK_GET_PAGE_POSTS,
    category: NODE_CATEGORIES.FACEBOOK,
    label: 'Get Page Posts',
    description: 'Get posts from Facebook page',
    icon: '📰',
    color: '#1877F2'
  },
  {
    type: NODE_TYPES.FACEBOOK_GET_MESSAGES,
    category: NODE_CATEGORIES.FACEBOOK,
    label: 'Get Messages',
    description: 'Get Facebook Messenger conversations',
    icon: '💬',
    color: '#1877F2'
  },
  {
    type: NODE_TYPES.FACEBOOK_SEND_MESSAGE,
    category: NODE_CATEGORIES.FACEBOOK,
    label: 'Send Message',
    description: 'Send messages via Facebook Messenger',
    icon: '📤',
    color: '#1877F2'
  },
  {
    type: NODE_TYPES.FACEBOOK_REPLY_MESSAGE,
    category: NODE_CATEGORIES.FACEBOOK,
    label: 'Reply Message',
    description: 'Reply to Facebook Messenger messages',
    icon: '↩️',
    color: '#1877F2'
  },
  {
    type: NODE_TYPES.FACEBOOK_GET_POST_COMMENTS,
    category: NODE_CATEGORIES.FACEBOOK,
    label: 'Get Post Comments',
    description: 'Get comments from Facebook posts',
    icon: '💭',
    color: '#1877F2'
  },
  {
    type: NODE_TYPES.FACEBOOK_REPLY_COMMENT,
    category: NODE_CATEGORIES.FACEBOOK,
    label: 'Reply Comment',
    description: 'Reply to Facebook post comments',
    icon: '💬',
    color: '#1877F2'
  },
  {
    type: NODE_TYPES.FACEBOOK_GET_PAGE_INSIGHTS,
    category: NODE_CATEGORIES.FACEBOOK,
    label: 'Get Page Insights',
    description: 'Get Facebook page analytics and metrics',
    icon: '📊',
    color: '#1877F2'
  },
  
  // LinkedIn Nodes
  {
    type: NODE_TYPES.LINKEDIN_GET_PROFILE,
    category: NODE_CATEGORIES.LINKEDIN,
    label: 'Get Profile',
    description: 'Get LinkedIn profile information',
    icon: '👤',
    color: '#0077B5'
  },
  {
    type: NODE_TYPES.LINKEDIN_CREATE_POST,
    category: NODE_CATEGORIES.LINKEDIN,
    label: 'Create Post',
    description: 'Create posts on LinkedIn',
    icon: '📝',
    color: '#0077B5'
  },
  {
    type: NODE_TYPES.LINKEDIN_SEND_MESSAGE,
    category: NODE_CATEGORIES.LINKEDIN,
    label: 'Send Message',
    description: 'Send direct messages on LinkedIn',
    icon: '📤',
    color: '#0077B5'
  },
  {
    type: NODE_TYPES.LINKEDIN_GET_COMPANY,
    category: NODE_CATEGORIES.LINKEDIN,
    label: 'Get Company',
    description: 'Get LinkedIn company page information',
    icon: '🏢',
    color: '#0077B5'
  },
  
  // WhatsApp Nodes
  {
    type: NODE_TYPES.WHATSAPP_TRIGGER,
    category: NODE_CATEGORIES.WHATSAPP,
    label: 'WhatsApp Trigger',
    description: 'Trigger workflow when receiving WhatsApp message from specific number',
    icon: '📱',
    color: '#25D366'
  }
];