import React, { useState, useMemo } from 'react';
import { UserRole, User, Course, Submission, Lesson } from './types';
import Chatbot from './components/Chatbot';
import AIAssistant from './components/AIAssistant';
import { getGeminiFlashResponse } from './services/geminiService';

// Mock Data
const MOCK_USERS: User[] = [
    { id: 'user-edu-1', name: 'Dr. Ada Lovelace', role: UserRole.EDUCATOR },
    { id: 'user-stu-1', name: 'Charles Babbage', role: UserRole.STUDENT },
    { id: 'user-stu-2', name: 'Grace Hopper', role: UserRole.STUDENT },
    { id: 'user-stu-3', name: 'Alan Turing', role: UserRole.STUDENT },
];

const MOCK_SUBMISSIONS: Submission[] = [
    { studentId: 'user-stu-1', assignmentId: 'a1', content: 'Here is my FizzBuzz solution in Python...', submittedAt: '2024-10-25', grade: 95 },
    { studentId: 'user-stu-2', assignmentId: 'a1', content: 'My submission for the FizzBuzz challenge.', submittedAt: '2024-10-24', grade: 88 },
    { studentId: 'user-stu-2', assignmentId: 'a2', content: 'Implemented the BST as requested.', submittedAt: '2024-11-14' },
];

const MOCK_COURSES: Course[] = [
    {
        id: 'course-101',
        title: 'Introduction to Computational Thinking',
        description: 'Learn the fundamentals of programming and problem-solving.',
        educatorId: 'user-edu-1',
        lessons: [{ id: 'l1', title: 'What is an Algorithm?', content: 'An algorithm is a step-by-step procedure for calculations.', completedBy: ['user-stu-1'] }],
        assignments: [{ id: 'a1', title: 'FizzBuzz Challenge', description: 'Write a program that prints numbers from 1 to 100...', dueDate: '2024-10-26' }],
        enrolledStudentIds: ['user-stu-1', 'user-stu-2'],
    },
    {
        id: 'course-201',
        title: 'Advanced Data Structures',
        description: 'Deep dive into complex data structures and their applications.',
        educatorId: 'user-edu-1',
        lessons: [{ id: 'l2', title: 'Trees and Graphs', content: 'Exploring non-linear data structures.', completedBy: [] }],
        assignments: [{ id: 'a2', title: 'Implement a BST', description: 'Implement a Binary Search Tree with insertion, deletion, and search methods.', dueDate: '2024-11-15' }],
        enrolledStudentIds: ['user-stu-2'],
    },
];

// --- Sub-Components (defined outside App to prevent re-creation on re-renders) ---

interface HeaderProps {
    user: User;
    onLogout: () => void;
    enrolledCourses: Course[];
    onCourseSelect: (courseId: string) => void;
}
const Header: React.FC<HeaderProps> = ({ user, onLogout, enrolledCourses, onCourseSelect }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleCourseNavigation = (courseId: string) => {
        onCourseSelect(courseId);
        setIsDropdownOpen(false);
    }
    
    return (
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
            <div className="flex items-center">
                <span className="material-symbols-outlined text-indigo-500 text-3xl mr-2">school</span>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Edu Tracker</h1>
            </div>
            <div className="flex items-center">
                 {user.role === UserRole.STUDENT && enrolledCourses.length > 0 && (
                    <div className="relative mr-4">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400"
                        >
                            My Courses
                            <span className={`material-symbols-outlined transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>
                        {isDropdownOpen && (
                             <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-20" onMouseLeave={() => setIsDropdownOpen(false)}>
                                {enrolledCourses.map(course => (
                                    <a 
                                        key={course.id} 
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); handleCourseNavigation(course.id); }}
                                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                    >
                                        {course.title}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <span className="hidden sm:inline text-gray-600 dark:text-gray-300 mr-4">Welcome, {user.name}</span>
                <button
                    onClick={onLogout}
                    className="flex items-center bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                    <span className="material-symbols-outlined mr-1">logout</span>
                    Logout
                </button>
            </div>
        </header>
    );
};

interface LoginScreenProps {
    onLogin: (user: User) => void;
}
const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const educators = MOCK_USERS.filter(u => u.role === UserRole.EDUCATOR);
    const students = MOCK_USERS.filter(u => u.role === UserRole.STUDENT);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-lg p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-center">
                    <span className="material-symbols-outlined text-indigo-500 text-6xl">school</span>
                    <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">Welcome to Edu Tracker</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Select your profile to begin</p>
                </div>

                <div className="space-y-8">
                    {/* Educator Login Section */}
                    <div>
                        <div className="flex items-center mb-4">
                             <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 mr-3">admin_panel_settings</span>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Educator Portal</h3>
                        </div>
                        <div className="flex flex-col space-y-3">
                            {educators.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => onLogin(user)}
                                    className="w-full text-left py-3 px-4 border border-gray-300 dark:border-gray-600 text-lg font-medium rounded-md text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    {user.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>

                    {/* Student Login Section */}
                    <div>
                         <div className="flex items-center mb-4">
                            <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 mr-3">person</span>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Student Portal</h3>
                        </div>
                        <div className="flex flex-col space-y-3">
                            {students.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => onLogin(user)}
                                    className="w-full text-left py-3 px-4 border border-gray-300 dark:border-gray-600 text-lg font-medium rounded-md text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    {user.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface GradeInputProps {
    submission: Submission;
    onGradeSubmit: (studentId: string, assignmentId: string, grade: number) => void;
}
const GradeInput: React.FC<GradeInputProps> = ({ submission, onGradeSubmit }) => {
    const [grade, setGrade] = useState<string>(submission.grade?.toString() ?? '');

    const handleSave = () => {
        const gradeValue = parseInt(grade, 10);
        if (!isNaN(gradeValue) && gradeValue >= 0 && gradeValue <= 100) {
            onGradeSubmit(submission.studentId, submission.assignmentId, gradeValue);
        } else {
            alert('Please enter a valid grade between 0 and 100.');
        }
    };

    return (
        <div className="flex items-center gap-2 mt-2">
            <input
                type="number"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="0-100"
                className="w-24 p-1 border rounded bg-gray-50 dark:bg-gray-600 dark:border-gray-500"
            />
            <button onClick={handleSave} className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">
                Save
            </button>
        </div>
    );
};

interface AssignmentSubmissionFormProps {
    assignmentId: string;
    onSubmit: (assignmentId: string, content: string) => void;
}
const AssignmentSubmissionForm: React.FC<AssignmentSubmissionFormProps> = ({ assignmentId, onSubmit }) => {
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            alert('Submission content cannot be empty.');
            return;
        }
        onSubmit(assignmentId, content);
        setContent(''); 
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your Submission</label>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="Type your submission here..."
                required
            />
            <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-semibold disabled:bg-indigo-400 disabled:cursor-not-allowed transition"
                disabled={!content.trim()}
            >
                Submit Assignment
            </button>
        </form>
    );
};


// --- Main App Component ---

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
    const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedStudentForProgress, setSelectedStudentForProgress] = useState<User | null>(null);
    const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
    const [view, setView] = useState<'dashboard' | 'course' | 'assignment' | 'research' | 'progress'>('dashboard');
    const [editingLesson, setEditingLesson] = useState<any>(null);
    const [isAILoading, setIsAILoading] = useState(false);

    const handleAIAssist = async (prompt: string, currentContent: string) => {
        setIsAILoading(true);
        try {
            const fullPrompt = `${prompt}:\n\n---\n\n${currentContent}`;
            const result = await getGeminiFlashResponse(fullPrompt);
            setEditingLesson({ ...editingLesson, content: result });
        } catch (error) {
            console.error("AI Assist Error:", error);
        } finally {
            setIsAILoading(false);
        }
    };
    
    const handleGradeSubmit = (studentId: string, assignmentId: string, grade: number) => {
        setSubmissions(prevSubmissions =>
            prevSubmissions.map(sub =>
                sub.studentId === studentId && sub.assignmentId === assignmentId ? { ...sub, grade } : sub
            )
        );
    };

    const handleAssignmentSubmit = (assignmentId: string, content: string) => {
        if (!currentUser) return;
        const newSubmission: Submission = {
            studentId: currentUser.id,
            assignmentId,
            content,
            submittedAt: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
        };
        setSubmissions(prev => [...prev, newSubmission]);
    };
    
    const handleMarkLessonComplete = (lessonId: string) => {
        if (!currentUser || !selectedCourseId) return;
        setCourses(prevCourses => prevCourses.map(course => {
            if (course.id === selectedCourseId) {
                return {
                    ...course,
                    lessons: course.lessons.map(lesson => {
                        if (lesson.id === lessonId && !lesson.completedBy.includes(currentUser.id)) {
                            return { ...lesson, completedBy: [...lesson.completedBy, currentUser.id] };
                        }
                        return lesson;
                    })
                };
            }
            return course;
        }));
    };

    const handleAddStudentToCourse = (studentId: string) => {
        if (!selectedCourseId) return;
        setCourses(prevCourses =>
            prevCourses.map(course => {
                if (course.id === selectedCourseId && !course.enrolledStudentIds.includes(studentId)) {
                    return { ...course, enrolledStudentIds: [...course.enrolledStudentIds, studentId] };
                }
                return course;
            })
        );
    };
    
    const handleRemoveStudentFromCourse = (studentId: string) => {
        if (!selectedCourseId) return;
        setCourses(prevCourses =>
            prevCourses.map(course => {
                if (course.id === selectedCourseId) {
                    return { ...course, enrolledStudentIds: course.enrolledStudentIds.filter(id => id !== studentId) };
                }
                return course;
            })
        );
    };

    const selectedCourse = useMemo(() => courses.find(c => c.id === selectedCourseId), [courses, selectedCourseId]);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setSelectedCourseId(null);
        setView('dashboard');
    };
    
    const handleAddCourse = () => {
        const newCourse = {
            id: `course-${Date.now()}`,
            title: 'New Course Title',
            description: 'A brief description of the new course.',
            educatorId: currentUser!.id,
            lessons: [],
            assignments: [],
            enrolledStudentIds: [],
        };
        setCourses([...courses, newCourse]);
    };
    
    const handleCourseNavigation = (courseId: string) => {
        setSelectedCourseId(courseId);
        setView('course');
    };

    const studentEnrolledCourses = useMemo(() => {
        if (currentUser?.role !== UserRole.STUDENT) return [];
        return courses.filter(c => c.enrolledStudentIds.includes(currentUser!.id));
    }, [courses, currentUser]);

    const renderDashboard = () => (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
                 {currentUser?.role === UserRole.EDUCATOR && (
                    <button onClick={handleAddCourse} className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-600">
                        <span className="material-symbols-outlined mr-2">add</span>New Course
                    </button>
                )}
            </div>
            <div className="mb-8">
                <button onClick={() => setView('research')} className="w-full text-left p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900 transition">
                    <h3 className="text-xl font-bold text-indigo-800 dark:text-indigo-200">AI Research Assistant</h3>
                    <p className="text-indigo-600 dark:text-indigo-400">Access grounded, up-to-date information for your studies or lesson plans.</p>
                </button>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">My Courses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.filter(c => currentUser?.role === UserRole.EDUCATOR ? c.educatorId === currentUser.id : c.enrolledStudentIds.includes(currentUser!.id))
                    .map(course => (
                        <div key={course.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer transform hover:-translate-y-1 transition-transform duration-300"
                             onClick={() => handleCourseNavigation(course.id)}>
                            <img src={`https://picsum.photos/seed/${course.id}/400/200`} alt={course.title} className="w-full h-40 object-cover" />
                            <div className="p-6">
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{course.title}</h4>
                                <p className="text-gray-600 dark:text-gray-400 mt-2">{course.description}</p>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
    
    const renderCourseView = () => {
        if (!selectedCourse) return <div>Course not found.</div>;
        return (
            <div className="p-8">
                 <button onClick={() => setView('dashboard')} className="mb-6 flex items-center text-indigo-600 dark:text-indigo-400 hover:underline">
                    <span className="material-symbols-outlined">arrow_back</span> Back to Dashboard
                </button>
                 <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{selectedCourse.title}</h2>
                        <p className="text-gray-600 dark:text-gray-400">{selectedCourse.description}</p>
                    </div>
                    {currentUser?.role === UserRole.EDUCATOR && (
                        <div className="flex flex-col sm:flex-row gap-2">
                             <button onClick={() => setIsEnrollmentModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-blue-700">
                                <span className="material-symbols-outlined mr-2">group_add</span>Manage Enrollment
                            </button>
                            <button onClick={() => setView('progress')} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-purple-700">
                                <span className="material-symbols-outlined mr-2">monitoring</span>View Progress
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Lessons</h3>
                        <div className="space-y-4">
                           {selectedCourse.lessons.map(lesson => (
                                <div key={lesson.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-900 dark:text-white">{lesson.title}</h4>
                                            <p className="text-gray-700 dark:text-gray-300 mt-1">{lesson.content}</p>
                                        </div>
                                        {currentUser?.role === UserRole.STUDENT && (
                                            <div className="ml-4 flex-shrink-0">
                                                {lesson.completedBy.includes(currentUser.id) ? (
                                                    <span className="flex items-center text-green-600 dark:text-green-400 text-sm font-semibold">
                                                        <span className="material-symbols-outlined mr-1 text-base">check_circle</span>
                                                        Completed
                                                    </span>
                                                ) : (
                                                    <button onClick={() => handleMarkLessonComplete(lesson.id)} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Mark as Complete</button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                     {currentUser?.role === UserRole.EDUCATOR && (
                                         <button onClick={() => setEditingLesson(lesson)} className="text-sm text-indigo-500 mt-2 hover:underline">Edit</button>
                                     )}
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Assignments</h3>
                        <div className="space-y-4">
                            {selectedCourse.assignments.map(assignment => {
                                const submission = submissions.find(s => s.studentId === currentUser?.id && s.assignmentId === assignment.id);
                                return (
                                <div key={assignment.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">{assignment.title}</h4>
                                    <p className="text-gray-600 dark:text-gray-400">Due: {assignment.dueDate}</p>
                                    {currentUser?.role === UserRole.STUDENT && (
                                        <div className="mt-3 border-t pt-3 border-gray-200 dark:border-gray-700">
                                        {submission ? (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Your Submission:</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Submitted on: {submission.submittedAt}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded">{submission.content}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Grade: <span className={`font-bold ${submission.grade ? 'text-green-600' : 'text-yellow-600'}`}>{submission.grade ? `${submission.grade}%` : 'Not Graded Yet'}</span></p>
                                            </div>
                                        ) : (
                                            <AssignmentSubmissionForm assignmentId={assignment.id} onSubmit={handleAssignmentSubmit} />
                                        )}
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                {editingLesson && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl">
                             <h3 className="text-2xl font-bold mb-4">Edit Lesson</h3>
                            <input type="text" value={editingLesson.title} onChange={e => setEditingLesson({...editingLesson, title: e.target.value})} className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                            <textarea value={editingLesson.content} onChange={e => setEditingLesson({...editingLesson, content: e.target.value})} rows={10} className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                             <div className="flex items-center gap-2 mb-4 border-t pt-4 border-gray-200 dark:border-gray-600">
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">AI Actions:</span>
                                <button onClick={() => handleAIAssist('Summarize this content into key bullet points', editingLesson.content)} disabled={isAILoading} className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded disabled:bg-blue-300">Summarize</button>
                                <button onClick={() => handleAIAssist('Generate 3 multiple choice quiz questions based on this content', editingLesson.content)} disabled={isAILoading} className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded disabled:bg-green-300">Quiz</button>
                                <button onClick={() => handleAIAssist('Improve the writing and clarity of this text', editingLesson.content)} disabled={isAILoading} className="text-sm bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded disabled:bg-purple-300">Improve</button>
                                 {isAILoading && <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin"></div>}
                            </div>
                            <div className="flex justify-end gap-4">
                                <button onClick={() => setEditingLesson(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded">Cancel</button>
                                <button onClick={() => {
                                    setCourses(courses.map(c => c.id === selectedCourse.id ? {...c, lessons: c.lessons.map(l => l.id === editingLesson.id ? editingLesson : l)} : c));
                                    setEditingLesson(null);
                                }} className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    };
    
    const renderResearchView = () => (
         <div className="p-8">
            <button onClick={() => setView('dashboard')} className="mb-6 flex items-center text-indigo-600 dark:text-indigo-400 hover:underline">
                <span className="material-symbols-outlined">arrow_back</span> Back to Dashboard
            </button>
            <AIAssistant />
        </div>
    );
    
    const renderProgressView = () => {
        if (!selectedCourse) return <div>Course not found.</div>;
        const enrolledStudents = MOCK_USERS.filter(u => selectedCourse.enrolledStudentIds.includes(u.id));

        return (
            <div className="p-8">
                <button onClick={() => setView('course')} className="mb-6 flex items-center text-indigo-600 dark:text-indigo-400 hover:underline">
                    <span className="material-symbols-outlined">arrow_back</span> Back to Course
                </button>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Student Progress for {selectedCourse.title}</h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assignments Submitted</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lessons Completed</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Average Grade</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Details</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {enrolledStudents.map(student => {
                                const studentSubmissions = submissions.filter(s => s.studentId === student.id && selectedCourse.assignments.some(a => a.id === s.assignmentId));
                                const completedLessons = selectedCourse.lessons.filter(l => l.completedBy.includes(student.id));
                                const gradedSubmissions = studentSubmissions.filter(s => typeof s.grade === 'number');
                                const avgGrade = gradedSubmissions.length > 0 ? gradedSubmissions.reduce((acc, s) => acc + s.grade!, 0) / gradedSubmissions.length : 'N/A';

                                return (
                                    <tr key={student.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{student.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{studentSubmissions.length} / {selectedCourse.assignments.length}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{completedLessons.length} / {selectedCourse.lessons.length}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{typeof avgGrade === 'number' ? `${avgGrade.toFixed(2)}%` : avgGrade}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => setSelectedStudentForProgress(student)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">View Details</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                 {selectedStudentForProgress && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={() => setSelectedStudentForProgress(null)}>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-bold">Progress for {selectedStudentForProgress.name}</h3>
                                <button onClick={() => setSelectedStudentForProgress(null)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-xl font-semibold mb-3">Assignments</h4>
                                    <div className="space-y-3">
                                        {selectedCourse.assignments.map(assignment => {
                                            const submission = submissions.find(s => s.studentId === selectedStudentForProgress.id && s.assignmentId === assignment.id);
                                            return (
                                                <div key={assignment.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border dark:border-gray-600">
                                                    <p className="font-semibold">{assignment.title}</p>
                                                    {submission ? (
                                                        <div className="mt-2 text-sm">
                                                            <p className="text-green-600 dark:text-green-400">Submitted on {submission.submittedAt}</p>
                                                            <p className="mt-1"><strong>Content:</strong> {submission.content}</p>
                                                            <div className="mt-2">
                                                                <p className="font-medium">Grade: {submission.grade ?? 'Not Graded'}</p>
                                                                <GradeInput submission={submission} onGradeSubmit={handleGradeSubmit} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-red-500 dark:text-red-400 mt-2">Not Submitted</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-semibold mb-3">Lessons</h4>
                                    <ul className="space-y-2">
                                        {selectedCourse.lessons.map(lesson => (
                                            <li key={lesson.id} className={`flex items-center text-sm p-2 rounded-md ${lesson.completedBy.includes(selectedStudentForProgress.id) ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
                                                <span className="material-symbols-outlined mr-2 text-base">{lesson.completedBy.includes(selectedStudentForProgress.id) ? 'check_box' : 'check_box_outline_blank'}</span>
                                                {lesson.title}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                        </div>
                    </div>
                 )}
            </div>
        )
    };

    const renderEnrollmentModal = () => {
        if (!selectedCourse) return null;

        const allStudents = MOCK_USERS.filter(u => u.role === UserRole.STUDENT);
        const enrolledStudents = allStudents.filter(s => selectedCourse.enrolledStudentIds.includes(s.id));
        const availableStudents = allStudents.filter(s => !selectedCourse.enrolledStudentIds.includes(s.id));

        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={() => setIsEnrollmentModalOpen(false)}>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 pb-4 border-b dark:border-gray-600">
                        <h3 className="text-2xl font-bold">Manage Enrollment for {selectedCourse.title}</h3>
                        <button onClick={() => setIsEnrollmentModalOpen(false)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-grow">
                        {/* Enrolled Students */}
                        <div>
                            <h4 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Enrolled Students ({enrolledStudents.length})</h4>
                            <div className="space-y-2 pr-2">
                                {enrolledStudents.length > 0 ? enrolledStudents.map(student => (
                                    <div key={student.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                        <span className="font-medium">{student.name}</span>
                                        <button onClick={() => handleRemoveStudentFromCourse(student.id)} className="flex items-center text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold">
                                            <span className="material-symbols-outlined text-base mr-1">person_remove</span>
                                            Remove
                                        </button>
                                    </div>
                                )) : <p className="text-gray-500 dark:text-gray-400 italic">No students are enrolled in this course.</p>}
                            </div>
                        </div>
                        {/* Available Students */}
                        <div>
                            <h4 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Available Students ({availableStudents.length})</h4>
                            <div className="space-y-2 pr-2">
                                {availableStudents.length > 0 ? availableStudents.map(student => (
                                    <div key={student.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                        <span className="font-medium">{student.name}</span>
                                        <button onClick={() => handleAddStudentToCourse(student.id)} className="flex items-center text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-semibold">
                                             <span className="material-symbols-outlined text-base mr-1">person_add</span>
                                            Add
                                        </button>
                                    </div>
                                )) : <p className="text-gray-500 dark:text-gray-400 italic">No other students available to enroll.</p>}
                            </div>
                        </div>
                    </div>
                     <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-600">
                        <button onClick={() => setIsEnrollmentModalOpen(false)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Done</button>
                    </div>
                </div>
            </div>
        );
    };


    const renderContent = () => {
        switch(view) {
            case 'course': return renderCourseView();
            case 'research': return renderResearchView();
            case 'progress': return renderProgressView();
            case 'dashboard':
            default: return renderDashboard();
        }
    }

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
            <Header 
                user={currentUser} 
                onLogout={handleLogout} 
                enrolledCourses={studentEnrolledCourses}
                onCourseSelect={handleCourseNavigation} 
            />
            <main>
                {renderContent()}
            </main>
            {isEnrollmentModalOpen && renderEnrollmentModal()}
            <Chatbot />
        </div>
    );
};

export default App;