import React, { useState, useEffect } from 'react'
import integrationTests from '../../utils/integrationTest'
import visualTests from '../../utils/visualTesting'
import formValidationTests from '../../utils/formValidationTests'
import { useAuth } from '../../hooks/useAuth'

const TestingDashboard = () => {
  const { user } = useAuth()
  const [testResults, setTestResults] = useState({
    integration: null,
    visual: null,
    forms: null
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('integration')

  const runIntegrationTests = async () => {
    setLoading(true)
    try {
      const results = await integrationTests.runAllTests(user?.id || user?._id)
      setTestResults(prev => ({ ...prev, integration: results }))
    } catch (error) {
      //console.error('Integration tests failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const runVisualTests = () => {
    setLoading(true)
    try {
      const results = visualTests.runAllVisualTests()
      setTestResults(prev => ({ ...prev, visual: results }))
    } catch (error) {
      ////console.error('Visual tests failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const runFormTests = () => {
    setLoading(true)
    try {
      const results = formValidationTests.runAllFormTests()
      setTestResults(prev => ({ ...prev, forms: results }))
    } catch (error) {
      //console.error('Form tests failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    try {
      await runIntegrationTests()
      runVisualTests()
      runFormTests()
    } finally {
      setLoading(false)
    }
  }

  const renderTestStatus = (result) => {
    if (result === null) return <span className="badge bg-secondary">Not Run</span>
    if (result === true) return <span className="badge bg-success">✓ Pass</span>
    if (result === false) return <span className="badge bg-danger">✗ Fail</span>
    return <span className="badge bg-warning">~ Partial</span>
  }

  const renderIntegrationResults = () => {
    if (!testResults.integration) return <p>No integration test results available.</p>

    const { userService, taskService, authService, errorHandling } = testResults.integration

    return (
      <div className="test-results">
        <h4>Integration Test Results</h4>
        
        <div className="test-section">
          <h5>User Service</h5>
          <ul className="list-group">
            <li className="list-group-item d-flex justify-content-between">
              Get Users {renderTestStatus(userService?.getUsers)}
            </li>
            <li className="list-group-item d-flex justify-content-between">
              Search Users {renderTestStatus(userService?.searchUsers)}
            </li>
          </ul>
        </div>

        <div className="test-section mt-3">
          <h5>Task Service</h5>
          <ul className="list-group">
            <li className="list-group-item d-flex justify-content-between">
              Get User Tasks {renderTestStatus(taskService?.getUserTasks)}
            </li>
          </ul>
        </div>

        <div className="test-section mt-3">
          <h5>Error Handling</h5>
          <ul className="list-group">
            <li className="list-group-item d-flex justify-content-between">
              User Service Errors {renderTestStatus(errorHandling?.userServiceErrors)}
            </li>
            <li className="list-group-item d-flex justify-content-between">
              Task Service Errors {renderTestStatus(errorHandling?.taskServiceErrors)}
            </li>
          </ul>
        </div>
      </div>
    )
  }

  const renderVisualResults = () => {
    if (!testResults.visual) return <p>No visual test results available.</p>

    const { responsive, forms, pagination, interactive, navigation } = testResults.visual

    return (
      <div className="test-results">
        <h4>Visual Test Results</h4>
        
        <div className="test-section">
          <h5>Responsive Design</h5>
          <ul className="list-group">
            {responsive && Object.entries(responsive).map(([breakpoint, result]) => (
              <li key={breakpoint} className="list-group-item d-flex justify-content-between">
                {breakpoint} ({result.width}px) {renderTestStatus(result.tested)}
              </li>
            ))}
          </ul>
        </div>

        <div className="test-section mt-3">
          <h5>Interactive Elements</h5>
          <ul className="list-group">
            <li className="list-group-item d-flex justify-content-between">
              Buttons <span className="badge bg-info">{interactive?.buttons?.count || 0}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between">
              Links <span className="badge bg-info">{interactive?.links?.count || 0}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between">
              Form Inputs <span className="badge bg-info">{interactive?.inputs?.count || 0}</span>
            </li>
          </ul>
        </div>

        <div className="test-section mt-3">
          <h5>Pagination</h5>
          <ul className="list-group">
            {pagination && pagination.map((pag, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between">
                Pagination {index + 1} 
                <div>
                  <span className="badge bg-info me-1">{pag.buttonCount} buttons</span>
                  {renderTestStatus(pag.hasActiveState)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  const renderFormResults = () => {
    if (!testResults.forms) return <p>No form test results available.</p>

    const { loginForm, signupForm, taskForm, profileEditForm } = testResults.forms

    return (
      <div className="test-results">
        <h4>Form Validation Results</h4>
        
        <div className="test-section">
          <h5>Login Form</h5>
          <ul className="list-group">
            <li className="list-group-item d-flex justify-content-between">
              Email Validation {renderTestStatus(loginForm?.emailValidation)}
            </li>
            <li className="list-group-item d-flex justify-content-between">
              Password Validation {renderTestStatus(loginForm?.passwordValidation)}
            </li>
          </ul>
        </div>

        <div className="test-section mt-3">
          <h5>Signup Form</h5>
          <ul className="list-group">
            <li className="list-group-item d-flex justify-content-between">
              Fullname Validation {renderTestStatus(signupForm?.fullnameValidation)}
            </li>
            <li className="list-group-item d-flex justify-content-between">
              Username Validation {renderTestStatus(signupForm?.usernameValidation)}
            </li>
            <li className="list-group-item d-flex justify-content-between">
              Email Validation {renderTestStatus(signupForm?.emailValidation)}
            </li>
            <li className="list-group-item d-flex justify-content-between">
              Password Validation {renderTestStatus(signupForm?.passwordValidation)}
            </li>
          </ul>
        </div>

        <div className="test-section mt-3">
          <h5>Task Form</h5>
          <ul className="list-group">
            <li className="list-group-item d-flex justify-content-between">
              Title Validation {renderTestStatus(taskForm?.titleValidation)}
            </li>
            <li className="list-group-item d-flex justify-content-between">
              Due Date Validation {renderTestStatus(taskForm?.dueDateValidation)}
            </li>
            <li className="list-group-item d-flex justify-content-between">
              Priority Validation {renderTestStatus(taskForm?.priorityValidation)}
            </li>
            <li className="list-group-item d-flex justify-content-between">
              Tag Functionality {renderTestStatus(taskForm?.tagFunctionality)}
            </li>
          </ul>
        </div>

        <div className="test-section mt-3">
          <h5>Profile Edit Form</h5>
          <ul className="list-group">
            <li className="list-group-item d-flex justify-content-between">
              Avatar Selection {renderTestStatus(profileEditForm?.avatarSelection)}
            </li>
            <li className="list-group-item d-flex justify-content-between">
              Fullname Validation {renderTestStatus(profileEditForm?.fullnameValidation)}
            </li>
            <li className="list-group-item d-flex justify-content-between">
              Username Validation {renderTestStatus(profileEditForm?.usernameValidation)}
            </li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="testing-dashboard">
      <div className="container py-4">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>Testing Dashboard</h2>
              <div className="btn-group">
                <button 
                  className="btn btn-primary" 
                  onClick={runAllTests}
                  disabled={loading}
                >
                  {loading ? 'Running Tests...' : 'Run All Tests'}
                </button>
              </div>
            </div>

            {/* Test Control Buttons */}
            <div className="row mb-4">
              <div className="col-md-4">
                <button 
                  className="btn btn-outline-primary w-100" 
                  onClick={runIntegrationTests}
                  disabled={loading}
                >
                  Run Integration Tests
                </button>
              </div>
              <div className="col-md-4">
                <button 
                  className="btn btn-outline-secondary w-100" 
                  onClick={runVisualTests}
                  disabled={loading}
                >
                  Run Visual Tests
                </button>
              </div>
              <div className="col-md-4">
                <button 
                  className="btn btn-outline-success w-100" 
                  onClick={runFormTests}
                  disabled={loading}
                >
                  Run Form Tests
                </button>
              </div>
            </div>

            {/* Test Results Tabs */}
            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'integration' ? 'active' : ''}`}
                  onClick={() => setActiveTab('integration')}
                >
                  Integration Tests
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'visual' ? 'active' : ''}`}
                  onClick={() => setActiveTab('visual')}
                >
                  Visual Tests
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'forms' ? 'active' : ''}`}
                  onClick={() => setActiveTab('forms')}
                >
                  Form Tests
                </button>
              </li>
            </ul>

            {/* Test Results Content */}
            <div className="tab-content">
              {activeTab === 'integration' && renderIntegrationResults()}
              {activeTab === 'visual' && renderVisualResults()}
              {activeTab === 'forms' && renderFormResults()}
            </div>

            {/* Test Summary */}
            {(testResults.integration || testResults.visual || testResults.forms) && (
              <div className="mt-4">
                <div className="card">
                  <div className="card-header">
                    <h5>Test Summary</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="text-center">
                          <h6>Integration Tests</h6>
                          <div className={`badge ${testResults.integration ? 'bg-success' : 'bg-secondary'} fs-6`}>
                            {testResults.integration ? 'Completed' : 'Not Run'}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="text-center">
                          <h6>Visual Tests</h6>
                          <div className={`badge ${testResults.visual ? 'bg-success' : 'bg-secondary'} fs-6`}>
                            {testResults.visual ? 'Completed' : 'Not Run'}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="text-center">
                          <h6>Form Tests</h6>
                          <div className={`badge ${testResults.forms ? 'bg-success' : 'bg-secondary'} fs-6`}>
                            {testResults.forms ? 'Completed' : 'Not Run'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestingDashboard