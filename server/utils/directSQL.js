const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Direct SQL operations to bypass schema cache issues
const directSQL = {
  async createCommission(userId, amount, type, description = null) {
    const { data, error } = await supabase.rpc('create_commission', {
      p_user_id: userId,
      p_amount: amount,
      p_type: type,
      p_description: description
    });
    return { data, error };
  },

  async createPayout(userId, amount, method) {
    const { data, error } = await supabase.rpc('create_payout', {
      p_user_id: userId,
      p_amount: amount,
      p_method: method
    });
    return { data, error };
  },

  async createUTMConfig(userId, name, source, medium, campaign) {
    const { data, error } = await supabase.rpc('create_utm_config', {
      p_user_id: userId,
      p_name: name,
      p_utm_source: source,
      p_utm_medium: medium,
      p_utm_campaign: campaign
    });
    return { data, error };
  },

  async createTask(userId, title, description, type, rewardAmount = 0) {
    const { data, error } = await supabase.rpc('create_task', {
      p_user_id: userId,
      p_title: title,
      p_description: description,
      p_type: type,
      p_reward_amount: rewardAmount
    });
    return { data, error };
  }
};

module.exports = { directSQL };
