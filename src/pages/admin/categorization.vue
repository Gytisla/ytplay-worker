<template>
  <div class="space-y-6 mb-12">
    <!-- Filters -->
    <div class="bg-white dark:bg-slate-800 shadow-lg sm:rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4">
        <h3 class="text-lg leading-6 font-semibold text-gray-900 dark:text-white mb-4">
          Filters
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Category Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              v-model="categoryFilter"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">All Categories</option>
              <option
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.icon }} {{ category.name }}
              </option>
            </select>
          </div>

          <!-- Channel Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Channel Name
            </label>
            <input
              v-model="channelFilter"
              type="text"
              placeholder="Filter by channel name..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          <!-- Rule Type Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rule Type
            </label>
            <select
              v-model="ruleTypeFilter"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">All Rule Types</option>
              <option value="channel_id">📺 Channel Name</option>
              <option value="title_contains">📝 Title Contains</option>
              <option value="description_contains">📄 Description Contains</option>
              <option value="title_regex">🔍 Title Regex</option>
              <option value="duration_lt">⏱️ Duration Less Than</option>
            </select>
          </div>
        </div>

        <!-- Clear Filters -->
        <div class="mt-4 flex justify-end">
          <button
            @click="clearFilters"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md transition-colors duration-200"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Rules Table -->
    <div class="bg-white dark:bg-slate-800 shadow-lg overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="px-6 py-5">
        <h3 class="text-lg leading-6 font-semibold text-gray-900 dark:text-white">
          All Categorization Rules
        </h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Rules are processed in priority order (lower numbers first). Only active rules are applied. All conditions within a rule must match for categorization to occur.
        </p>
        <div class="mt-4">
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2 border border-transconst closeModal = () => {
  showCreateModal.value = false
  editingRule.value = null
  saveError.value = ''
  ruleForm.value = {
    name: '',
    priority: 999,
    category_id: '',
    active: true,
    conditionsArray: []
  }
  // Reset channel search state
  channelSearchQuery.value = ''
  channels.value = []
}-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors duration-200"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Create New Rule
          </button>
        </div>
      </div>
      <div v-if="loading" class="px-6 py-5">
        <div class="flex items-center justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
          <span class="ml-2 text-gray-600 dark:text-gray-400">Loading rules...</span>
        </div>
      </div>
      <div v-else-if="rules.length === 0" class="px-6 py-5">
        <p class="text-gray-500 dark:text-gray-400 text-center">No categorization rules found.</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                Priority
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                Name
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Conditions <span class="text-xs normal-case">(all must match)</span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                Status
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="rule in filteredRules" :key="rule.id" class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                  <span class="text-sm font-medium text-gray-900 dark:text-white min-w-8 text-center">{{ rule.priority }}</span>
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32" :title="rule.name">
                  {{ rule.name }}
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center">
                  <span class="text-lg mr-2">{{ rule.video_categories?.icon }}</span>
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {{ rule.video_categories?.name }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ rule.video_categories?.key }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="flex flex-wrap gap-1">
                  <span 
                    v-for="(condition, index) in rule.parsedConditions" 
                    :key="index"
                    :class="['inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', condition.color]"
                    :title="condition.label"
                  >
                    <span class="mr-1">{{ condition.icon }}</span>
                    <span class="truncate max-w-24">{{ condition.label }}</span>
                  </span>
                </div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <span :class="rule.active ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20' : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'"
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ rule.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center space-x-2">
                  <button
                    @click="editRule(rule)"
                    class="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 transition-colors duration-150"
                    :title="'Edit rule'"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    @click="deleteRule(rule.id)"
                    class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors duration-150"
                    :title="'Delete rule'"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || editingRule" class="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="closeModal">
      <div class="relative top-8 mx-auto p-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto" @click.stop>
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                  <svg v-if="editingRule" class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  <svg v-else class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ editingRule ? 'Edit Categorization Rule' : 'Create New Categorization Rule' }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ editingRule ? 'Modify the rule settings and conditions' : 'Define a new rule for automatic video categorization' }}
                  </p>
                </div>
              </div>
              <button
                @click="closeModal"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="px-6 py-6">
            <!-- Error Message -->
            <div v-if="saveError" class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                    Error saving rule
                  </h3>
                  <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                    {{ saveError }}
                  </div>
                </div>
              </div>
            </div>

            <form @submit.prevent="saveRule" class="space-y-6">
              <!-- Basic Settings Section -->
              <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <svg class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Basic Settings
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rule Name</label>
                    <input
                      v-model="ruleForm.name"
                      type="text"
                      required
                      placeholder="e.g., Tech News Channel"
                      class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                    <input
                      v-model.number="ruleForm.priority"
                      type="number"
                      required
                      min="1"
                      placeholder="1"
                      class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors duration-200"
                    />
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Lower numbers = higher priority</p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <select
                      v-model="ruleForm.category_id"
                      required
                      class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors duration-200"
                    >
                      <option value="">Select a category</option>
                      <option v-for="category in categories" :key="category.id" :value="category.id">
                        {{ category.icon }} {{ category.name }}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <div class="flex items-center space-x-3 mt-2">
                      <input
                        id="rule-active"
                        v-model="ruleForm.active"
                        type="checkbox"
                        class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded transition-colors duration-200"
                      />
                      <label for="rule-active" class="text-sm text-gray-700 dark:text-gray-300">
                        Rule is active
                      </label>
                    </div>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Inactive rules are ignored during categorization</p>
                  </div>
                </div>
              </div>

              <!-- Conditions Section -->
              <div>
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      <svg class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Conditions
                    </h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">All conditions must be met for the rule to apply</p>
                  </div>
                  <button
                    type="button"
                    @click="addCondition"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors duration-200"
                  >
                    <svg class="-ml-1 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                    Add Condition
                  </button>
                </div>

                <div v-if="ruleForm.conditionsArray.length === 0" class="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No conditions</h3>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Add at least one condition for this rule to work.</p>
                </div>

                <div v-else class="space-y-3">
                  <div v-for="(condition, index) in ruleForm.conditionsArray" :key="index" class="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div class="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                      <span class="text-sm font-semibold text-primary-600 dark:text-primary-400">{{ index + 1 }}</span>
                    </div>
                  <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Condition Type</label>
                      <select
                        v-model="condition.type"
                        @change="onConditionTypeChange(condition)"
                        class="w-full p-3 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="channel_id">📺 Channel Name</option>
                        <option value="title_contains">📝 Title Contains</option>
                        <option value="description_contains">📄 Description Contains</option>
                        <option value="title_regex">🔍 Title Regex</option>
                        <option value="duration_lt">⏱️ Duration Less Than</option>
                      </select>
                    </div>
                    <div class="relative">
                      <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Value</label>
                      
                      <!-- Channel autocomplete for channel_id type -->
                      <div v-if="condition.type === 'channel_id'" class="relative">
                        <input
                          v-model="channelSearchQuery"
                          @input="handleChannelInput"
                          @focus="() => handleChannelFocus(condition)"
                          @blur="handleChannelBlur"
                          type="text"
                          placeholder="Search for a channel..."
                          class="w-full p-3 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                        />
                        
                        <!-- Autocomplete dropdown -->
                        <div v-if="channels.length > 0" class="absolute z-10 mt-1 w-full bg-white dark:bg-slate-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                          <div v-if="channelSearchLoading" class="px-3 py-2 text-gray-500 dark:text-gray-400">
                            <div class="flex items-center">
                              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 dark:border-primary-400 mr-2"></div>
                              Searching...
                            </div>
                          </div>
                          <div v-else>
                            <div
                              v-for="channel in channels"
                              :key="channel.id"
                              @click="selectChannel(condition, channel)"
                              class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-slate-600"
                            >
                              <div class="flex items-center">
                                <div class="w-6 h-6 rounded-full mr-3 flex items-center justify-center bg-gray-200 dark:bg-gray-600 overflow-hidden relative">
                                  <img 
                                    v-if="channel.thumbnail" 
                                    :src="channel.thumbnail" 
                                    :alt="channel.title" 
                                    class="w-full h-full object-cover rounded-full"
                                    @error="handleImageError"
                                  />
                                  <span class="text-xs text-gray-600 dark:text-gray-400 absolute inset-0 flex items-center justify-center">📺</span>
                                </div>
                                <div class="flex-1">
                                  <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {{ channel.title }}
                                  </div>
                                  <div class="text-xs text-gray-500 dark:text-gray-400">
                                    {{ channel.subscribers ? `${channel.subscribers.toLocaleString()} subscribers` : 'Unknown subscribers' }}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Regular input for other condition types -->
                      <input
                        v-else
                        v-model="condition.value"
                        type="text"
                        :placeholder="getConditionPlaceholder(condition.type)"
                        class="w-full p-3 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="removeCondition(index)"
                    class="flex-shrink-0 p-2 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                    :title="'Remove condition ' + (index + 1)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
                <button
                  type="button"
                  @click="addCondition"
                  class="inline-flex items-center px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors duration-200"
                >
                  <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                  Add Condition
                </button>
              </div>
            </div>

              <!-- Modal Footer -->
              <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  @click="closeModal"
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ saving ? 'Saving...' : (editingRule ? 'Update Rule' : 'Create Rule') }}
                </button>
              </div>
          </form>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// https://nuxt.com/docs/guide/directory-structure/pages#page-metadata
definePageMeta({
  layout: 'admin'
})

import { ref, onMounted, computed } from 'vue'

// Types
interface CategorizationRule {
  id: string
  priority: number
  name: string
  conditions: Record<string, unknown>
  category_id: string
  active: boolean
  parsedConditions?: DisplayCondition[]
  video_categories?: {
    id: string
    name: string
    key: string
    color: string
    icon: string
  }
}

interface VideoCategory {
  id: string
  name: string
  key: string
  color: string
  icon: string
}

interface Channel {
  id: string
  title: string
  thumbnail: string | null
  subscribers: number | null
  slug: string
}

interface Condition {
  type: string
  value: string
}

interface DisplayCondition {
  type: string
  value: string
  label: string
  icon: string
  color: string
}

// State
const rules = ref<CategorizationRule[]>([])
const categories = ref<VideoCategory[]>([])
const channels = ref<Channel[]>([])
const loading = ref(true)
const showCreateModal = ref(false)
const editingRule = ref<CategorizationRule | null>(null)
const saving = ref(false)
const channelSearchQuery = ref('')
const channelSearchLoading = ref(false)
const channelNames = ref<Map<string, string>>(new Map())
const saveError = ref('')

// Filter state
const categoryFilter = ref('')
const channelFilter = ref('')
const ruleTypeFilter = ref('')

const ruleForm = ref({
  name: '',
  priority: 999,
  category_id: '',
  active: true,
  conditionsArray: [] as Condition[]
})

// Computed
// (ruleFormConditions removed - now sending conditionsArray directly)

// Methods
const loadRules = async () => {
  try {
    const response = await $fetch('/api/admin/categorization') as { rules: CategorizationRule[] }
    const rulesData = response.rules || []

    // Collect all unique channel IDs from all rules
    const channelIds = new Set<string>()
    for (const rule of rulesData) {
      for (const [key, value] of Object.entries(rule.conditions)) {
        if (key === 'channel_id') {
          channelIds.add(String(value))
        }
      }
    }

    // Fetch all channel names in one API call if we have any channel IDs
    if (channelIds.size > 0) {
      await loadChannelNames(Array.from(channelIds))
    }

    // Parse conditions for each rule using cached channel names
    for (const rule of rulesData) {
      rule.parsedConditions = parseConditionsSync(rule.conditions)
    }

    rules.value = rulesData
  } catch (error) {
    console.error('Error loading rules:', error)
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const response = await $fetch('/api/admin/categories') as { categories: VideoCategory[] }
    categories.value = response.categories || []
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const getConditionPlaceholder = (type: string): string => {
  switch (type) {
    case 'channel_id':
      return 'Search for a channel...'
    case 'title_contains':
      return 'keyword or phrase'
    case 'description_contains':
      return 'description text'
    case 'title_regex':
      return 'regular expression'
    case 'duration_lt':
      return 'seconds (e.g., 300)'
    default:
      return 'value'
  }
}

const searchChannels = async (query: string) => {
  channelSearchLoading.value = true
  try {
    const queryParams: any = {}
    if (query.trim()) {
      queryParams.search = query.trim()
      queryParams.limit = 10
    } else {
      // No search - show all channels (no limit)
      queryParams.limit = 1000 // High limit to show all
    }

    const response = await $fetch('/api/admin/channels', {
      query: queryParams
    }) as { channels: Channel[] }
    channels.value = response.channels || []
  } catch (error) {
    console.error('Failed to search channels:', error)
    channels.value = []
  } finally {
    channelSearchLoading.value = false
  }
}

// Debounced search to avoid too many API calls
let searchTimeout: NodeJS.Timeout | null = null
const debouncedSearchChannels = (query?: string) => {
  const searchQuery = query !== undefined ? query : channelSearchQuery.value
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    searchChannels(searchQuery)
  }, 300)
}

const handleChannelInput = () => {
  debouncedSearchChannels()
}

const handleChannelFocus = (condition?: Condition) => {
  // If focusing on a specific condition with a channel_id, populate the search query with its channel name
  if (condition && condition.type === 'channel_id' && condition.value && !channelSearchQuery.value) {
    const channelName = channelNames.value.get(condition.value) || condition.value
    channelSearchQuery.value = channelName
  }
  debouncedSearchChannels('')
}

const handleChannelBlur = () => {
  // Delay hiding to allow click on dropdown items
  setTimeout(() => {
    channels.value = []
  }, 150)
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const selectChannel = (condition: Condition, channel: Channel) => {
  condition.value = channel.id
  channelSearchQuery.value = channel.title
  channels.value = [] // Close dropdown
}

// Handle when condition type changes to channel_id
const onConditionTypeChange = (condition: Condition) => {
  if (condition.type === 'channel_id') {
    // If we have a channel ID but no search query, try to find the channel name from cache
    if (condition.value && !channelSearchQuery.value) {
      const channelName = channelNames.value.get(condition.value)
      if (channelName) {
        channelSearchQuery.value = channelName
      }
    }
  } else {
    // Clear channel search state for non-channel conditions
    channelSearchQuery.value = ''
    channels.value = []
  }
}

const loadChannelNames = async (channelIds: string[]) => {
  if (channelIds.length === 0) return

  try {
    const response = await $fetch('/api/admin/channels', {
      query: { ids: channelIds.join(',') }
    }) as { channels: Array<{ id: string, title: string }> }
    
    // Cache all channel names
    for (const channel of response.channels || []) {
      channelNames.value.set(channel.id, channel.title)
    }
  } catch (error) {
    console.error('Failed to load channel names:', error)
  }
}

const parseConditionsSync = (conditions: Record<string, unknown>): DisplayCondition[] => {
  const result: DisplayCondition[] = []
  for (const [key, value] of Object.entries(conditions)) {
    let label = ''
    let icon = ''
    let color = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'

    switch (key) {
      case 'channel_id':
        const channelName = channelNames.value.get(String(value)) || String(value)
        label = `Channel: ${channelName} (${String(value)})`
        icon = '📺'
        color = 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
        break
      case 'title_contains':
        label = `Title: "${String(value)}"`
        icon = '📝'
        color = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        break
      case 'description_contains':
        label = `Desc: "${String(value)}"`
        icon = '📄'
        color = 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
        break
      case 'title_regex':
        label = `Title ~ /${String(value)}/`
        icon = '🔍'
        color = 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
        break
      case 'duration_lt':
        label = `Duration < ${String(value)}s`
        icon = '⏱️'
        color = 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        break
      default:
        label = `${key}: ${String(value)}`
        icon = '❓'
    }

    result.push({
      type: key,
      value: String(value),
      label,
      icon,
      color
    })
  }
  return result
}

const addCondition = () => {
  ruleForm.value.conditionsArray.push({ type: 'title_contains', value: '' })
}

const removeCondition = (index: number) => {
  ruleForm.value.conditionsArray.splice(index, 1)
}

const editRule = async (rule: CategorizationRule) => {
  editingRule.value = rule
  ruleForm.value = {
    name: rule.name,
    priority: rule.priority,
    category_id: rule.category_id,
    active: rule.active,
    conditionsArray: Object.entries(rule.conditions).map(([type, value]) => ({
      type,
      value: String(value)
    }))
  }

  // Reset channel search state
  channelSearchQuery.value = ''
  channels.value = []

  // Pre-populate channel names for channel_id conditions
  for (const condition of ruleForm.value.conditionsArray) {
    if (condition.type === 'channel_id' && condition.value) {
      const channelName = channelNames.value.get(condition.value)
      // Set the search query to the first channel name found
      // This will pre-populate the input for channel conditions
      if (channelName && !channelSearchQuery.value) {
        channelSearchQuery.value = channelName
      }
    }
  }
}

const saveRule = async () => {
  saving.value = true
  saveError.value = ''
  try {
    const ruleData = {
      name: ruleForm.value.name,
      priority: ruleForm.value.priority,
      category_id: ruleForm.value.category_id,
      active: ruleForm.value.active,
      conditions: ruleForm.value.conditionsArray
    }

    if (editingRule.value) {
      // Update existing rule
      await $fetch(`/api/admin/categorization/${editingRule.value.id}`, {
        method: 'PUT',
        body: ruleData
      })
    } else {
      // Create new rule
      await $fetch('/api/admin/categorization', {
        method: 'POST',
        body: ruleData
      })
    }

    await loadRules()
    closeModal()
  } catch (error: any) {
    console.error('Error saving rule:', error)
    saveError.value = error?.data?.message || error?.message || 'An error occurred while saving the rule'
  } finally {
    saving.value = false
  }
}

const deleteRule = async (ruleId: string) => {
  if (!confirm('Are you sure you want to delete this rule?')) return

  try {
    await $fetch(`/api/admin/categorization/${ruleId}`, {
      method: 'DELETE'
    })
    await loadRules()
  } catch (error) {
    console.error('Error deleting rule:', error)
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingRule.value = null
  ruleForm.value = {
    name: '',
    priority: 100,
    category_id: '',
    active: true,
    conditionsArray: []
  }
  // Reset channel search state
  channelSearchQuery.value = ''
  channels.value = []
}

// Filter methods
const clearFilters = () => {
  categoryFilter.value = ''
  channelFilter.value = ''
  ruleTypeFilter.value = ''
}

const filteredRules = computed(() => {
  return rules.value.filter(rule => {
    // Category filter
    if (categoryFilter.value && rule.category_id !== categoryFilter.value) {
      return false
    }

    // Channel filter - check if any condition has channel_id and matches the filter
    if (channelFilter.value) {
      const hasMatchingChannel = rule.parsedConditions?.some(condition => {
        if (condition.type === 'channel_id') {
          const channelName = condition.label.toLowerCase()
          return channelName.includes(channelFilter.value.toLowerCase())
        }
        return false
      })
      if (!hasMatchingChannel) {
        return false
      }
    }

    // Rule type filter
    if (ruleTypeFilter.value) {
      const hasMatchingType = rule.parsedConditions?.some(condition =>
        condition.type === ruleTypeFilter.value
      )
      if (!hasMatchingType) {
        return false
      }
    }

    return true
  })
})

// Load data on mount
onMounted(() => {
  loadRules()
  loadCategories()
})
</script>